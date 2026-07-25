import type { Pond, PondStatus, PondType } from '../../types'
import { STATUS_META, TYPE_LABELS } from './pondInsights'

interface PondCardSummary {
  cultivationDays?: number | null
  feedTodayKg?: number | null
  feedAccumulatedKg?: number | null
  avgWeightG?: number | null
  plCount?: number | null
  density?: number | null
  lotLabel?: string | null
}

interface Props {
  pond: Pond
  summary?: PondCardSummary
  onOpenCanvas?: (id: string) => void
}

function fmt(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function getStatusMeta(status: PondStatus) {
  return STATUS_META[status] ?? STATUS_META.VAZIO
}

function getTypeLabel(type: PondType) {
  return TYPE_LABELS[type] ?? type
}

export function PondCard({ pond, summary, onOpenCanvas }: Props) {
  const status = getStatusMeta(pond.status)

  const metricItems = [
    { label: 'Area', value: `${fmt(pond.areaHa, 2)} ha` },
    { label: 'Cultivo', value: summary?.cultivationDays !== null && summary?.cultivationDays !== undefined ? `${summary.cultivationDays} dias` : '-' },
    { label: 'Peso', value: summary?.avgWeightG !== null && summary?.avgWeightG !== undefined ? `${fmt(summary.avgWeightG, 2)} g` : '-' },
    { label: 'Racao hoje', value: summary?.feedTodayKg !== null && summary?.feedTodayKg !== undefined ? `${fmt(summary.feedTodayKg, 1)} kg` : '-' },
  ]

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,248,255,0.96))',
        boxShadow: '0 26px 70px rgba(15, 23, 42, 0.10)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at top right, ${status.surface} 0, transparent 42%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  backgroundColor: status.surface,
                  color: status.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {status.label}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {getTypeLabel(pond.type)}
              </div>
            </div>

            <div style={{ color: 'var(--text-primary)', fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em' }}>{pond.code}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{pond.name}</div>
          </div>

          <div
            style={{
              minWidth: 64,
              textAlign: 'right',
              padding: '10px 12px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estoque</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
              {summary?.plCount ? `${Math.round(summary.plCount / 1000)}k` : '-'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {metricItems.map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 16,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.78)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, marginTop: 5 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(255,255,255,0.92))',
          border: '1px solid rgba(56,189,248,0.12)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lote ativo</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginTop: 5 }}>
            {summary?.lotLabel ?? 'Sem lote ativo'}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
            <span>Racao acum.: {summary?.feedAccumulatedKg !== null && summary?.feedAccumulatedKg !== undefined ? `${fmt(summary.feedAccumulatedKg, 1)} kg` : '-'}</span>
            <span>Densidade: {summary?.density !== null && summary?.density !== undefined ? `${fmt(summary.density, 1)} PL/m2` : '-'}</span>
          </div>
        </div>

        {onOpenCanvas && (
          <button
            onClick={() => onOpenCanvas(pond.id)}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(2,132,199,0.16)',
              background: 'linear-gradient(135deg, #0f172a, #0284c7)',
              color: '#f8fafc',
              padding: '12px 14px',
              fontWeight: 700,
              fontSize: 13,
              textAlign: 'left',
              boxShadow: '0 16px 34px rgba(15, 23, 42, 0.18)',
            }}
          >
            Abrir painel do viveiro
          </button>
        )}
      </div>
    </div>
  )
}
