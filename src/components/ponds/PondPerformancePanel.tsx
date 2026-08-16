import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useBiometricKpis, useBiometrics } from '../../hooks/useBiometrics'
import { useFeedingList } from '../../hooks/useFeeding'
import { buildBiometricFeedTimeline } from './pondInsights'

interface Props {
  cycleId: string
  stockDate: string
}

function fmt(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function PondPerformancePanel({ cycleId, stockDate }: Props) {
  const { data: biometrics = [], isLoading: biometricsLoading } = useBiometrics(cycleId)
  const { data: kpis, isLoading: kpisLoading } = useBiometricKpis(cycleId)
  const { data: feedingHistory, isLoading: feedingLoading } = useFeedingList({ cycleId, limit: 200 })

  if (biometricsLoading || kpisLoading || feedingLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando acompanhamento...</div>
  }

  const timeline = buildBiometricFeedTimeline({
    biometrics,
    feedings: feedingHistory?.items ?? [],
    stockDate,
  })

  const lastPoint = timeline[timeline.length - 1]

  const summaryCards = [
    {
      label: 'Peso médio',
      value: kpis?.pesoMedioG !== null && kpis?.pesoMedioG !== undefined ? `${fmt(kpis.pesoMedioG, 2)} g` : '-',
      tone: '#0284c7',
    },
    {
      label: 'Ração acumulada',
      value: `${fmt(kpis?.racaoConsumidaKg ?? 0, 1)} kg`,
      tone: '#38bdf8',
    },
    {
      label: 'FCA atual',
      value: kpis?.fca !== null && kpis?.fca !== undefined ? fmt(kpis.fca, 2) : '-',
      tone: '#1d4ed8',
    },
    {
      label: 'Sobrevivência',
      value: kpis?.survivalPct !== null && kpis?.survivalPct !== undefined ? `${fmt(kpis.survivalPct, 1)}%` : '-',
      tone: '#0ea5e9',
    },
  ]

  const insight = lastPoint
    ? lastPoint.growthDeltaG && lastPoint.growthDeltaG > 0
      ? `${fmt(lastPoint.growthDeltaG, 2)} g de ganho com ${fmt(lastPoint.feedWindowKg, 1)} kg ofertados na janela.`
      : `${fmt(lastPoint.feedWindowKg, 1)} kg ofertados até última biometria, sem delta suficiente para comparar ganho.`
    : 'Ainda não há biometria suficiente para cruzar crescimento com oferta de ração.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: `linear-gradient(135deg, ${card.tone}18, rgba(255,255,255,0.96))`,
              padding: '12px 14px',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {card.label}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginTop: 6 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 16,
          padding: 14,
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,248,255,0.96))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>Biometria x oferta de ração</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Janela por biometria, usando os dias do cultivo como eixo.</div>
          </div>
          {lastPoint && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'right' }}>
              <div>Última leitura</div>
              <div style={{ fontWeight: 700 }}>D{lastPoint.cultivationDay}</div>
            </div>
          )}
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.26)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="feed" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}kg`} />
              <YAxis
                yAxisId="weight"
                orientation="right"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={(value) => `${value}g`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: '0 18px 44px rgba(15, 23, 42, 0.12)',
                }}
                formatter={(value: any, name: any) => {
                  const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                  if (name === 'feedWindowKg') return [`${fmt(numericValue, 1)} kg`, 'Ração na janela']
                  if (name === 'averageWeightG') return [`${fmt(numericValue, 2)} g`, 'Peso médio']
                  return [numericValue, String(name ?? '')]
                }}
                labelFormatter={(label) => `Biometria ${label}`}
              />
              <Bar yAxisId="feed" dataKey="feedWindowKg" fill="#0284c7" radius={[8, 8, 2, 2]} barSize={22} />
              <Line yAxisId="weight" type="monotone" dataKey="averageWeightG" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          borderRadius: 14,
          padding: '12px 14px',
          border: '1px solid rgba(14, 165, 233, 0.18)',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(255,255,255,0.96))',
        }}
      >
        <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Leitura operacional
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>{insight}</div>
      </div>
    </div>
  )
}
