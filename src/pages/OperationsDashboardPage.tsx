import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRightLeft,
  ClipboardList,
  Fish,
  LayoutDashboard,
  Package,
} from 'lucide-react'
import { useBiometricKpis, useBiometrics } from '../hooks/useBiometrics'
import { useCycles, useCyclesSummary } from '../hooks/useCycles'
import { useFeedingTable } from '../hooks/useFeeding'
import { usePonds } from '../hooks/usePonds'
import { useWaterQuality } from '../hooks/useWaterQuality'
import { Table } from '../components/ui/Table'
import type { FeedingTableRow, PondStatus, WaterQuality } from '../types'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: PondStatus) {
  if (status === 'VAZIO') return 'Vazio'
  if (status === 'PREPARANDO') return 'Preparando'
  if (status === 'POVOADO') return 'Povoado'
  if (status === 'DESPESCANDO') return 'Despesca'
  return 'Inativo'
}

export function OperationsDashboardPage() {
  const today = todayIsoDate()
  const { data: ponds = [] } = usePonds()
  const { data: activeCycles = [] } = useCycles({ status: 'ativo' })
  const { data: cyclesSummary } = useCyclesSummary()
  const { data: feedingTable, isLoading: feedingLoading } = useFeedingTable({ date: today })
  const { data: biometrics = [] } = useBiometrics(activeCycles[0]?.id ?? null)
  const { data: biometricKpis } = useBiometricKpis(activeCycles[0]?.id ?? null)
  const { data: waterQuality = [] } = useWaterQuality(activeCycles[0]?.id)

  const rows = feedingTable?.rows ?? []
  const sortedRows = [...rows].sort((left, right) => right.dailyFeedKg - left.dailyFeedKg)
  const topConsumer = sortedRows[0]
  const zeroFeedCount = rows.filter((row) => row.dailyFeedKg === 0).length
  const latestWaterQuality = waterQuality[0] as WaterQuality | undefined
  const latestPond = activeCycles[0]?.pond

  const summaryCards = [
    { label: 'Viveiros', value: ponds.length, icon: <LayoutDashboard size={18} /> },
    { label: 'Povoados', value: ponds.filter((pond) => pond.status === 'POVOADO').length, icon: <Fish size={18} /> },
    { label: 'Lotes ativos', value: activeCycles.length, icon: <ClipboardList size={18} /> },
    { label: 'População ativa', value: fmt(cyclesSummary?.totalPopulation ?? 0, 0), icon: <Activity size={18} /> },
    { label: 'Ração hoje', value: `${fmt(feedingTable?.totals.dailyFeedKg ?? 0, 1)} kg`, icon: <Package size={18} /> },
    { label: 'Ração acumulada', value: `${fmt(feedingTable?.totals.racaoAcumuladaKg ?? 0, 1)} kg`, icon: <ArrowRightLeft size={18} /> },
  ]

  const quickActions = [
    {
      title: 'Cadastrar viveiro',
      description: 'Abrir o cadastro sem sair do painel.',
      to: '/tanques',
      icon: <LayoutDashboard size={18} />,
    },
    {
      title: 'Povoar',
      description: 'Distribuir um lote entre viveiros.',
      to: '/povoamento',
      icon: <ClipboardList size={18} />,
    },
    {
      title: 'Transferir',
      description: 'Mover a operação para outro viveiro.',
      to: '/transferencia',
      icon: <ArrowRightLeft size={18} />,
    },
    {
      title: 'Definir ração',
      description: 'Ajustar a dieta com base nas biometrias.',
      to: '/nutrition',
      icon: <Package size={18} />,
    },
  ]

  const feedingColumns = [
    {
      key: 'pond',
      header: 'Viveiro',
      render: (row: FeedingTableRow) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.pondCode}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.lotCode}</div>
        </div>
      ),
    },
    {
      key: 'pondStatus',
      header: 'Status',
      render: (row: FeedingTableRow) => <span>{statusLabel(row.pondStatus)}</span>,
    },
    {
      key: 'dailyFeedKg',
      header: 'Hoje (kg)',
      align: 'right' as const,
      render: (row: FeedingTableRow) => `${fmt(row.dailyFeedKg, 1)} kg`,
    },
    {
      key: 'racaoAcumuladaKg',
      header: 'Acumulado',
      align: 'right' as const,
      render: (row: FeedingTableRow) => `${fmt(row.racaoAcumuladaKg, 1)} kg`,
    },
    {
      key: 'estimatedBagsUsed',
      header: 'Sacas',
      align: 'right' as const,
      render: (row: FeedingTableRow) => fmt(row.estimatedBagsUsed, 2),
    },
    {
      key: 'responsibleName',
      header: 'Último trato',
      render: (row: FeedingTableRow) => `${row.responsibleName} · ${fmtDate(row.lastFedAt)}`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section
        style={{
          borderRadius: 28,
          padding: 24,
          color: 'var(--text-primary)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,248,255,0.98))',
          boxShadow: '0 20px 48px rgba(22, 33, 27, 0.08)',
          border: '1px solid rgba(56,189,248,0.18)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
            <Activity size={14} />
            Painel operacional
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 18px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(224,242,254,0.90))',
                  border: '1px solid rgba(56,189,248,0.18)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  boxShadow: '0 12px 28px rgba(2, 132, 199, 0.06)',
                  minHeight: 92,
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(2,132,199,0.10)',
                    color: 'var(--accent-dark)',
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{action.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{action.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 16,
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
              minHeight: 108,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {card.label}
              </div>
              <div style={{ color: 'var(--accent-dark)' }}>{card.icon}</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 28, lineHeight: 1, fontWeight: 800, color: 'var(--text-primary)' }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 18,
            boxShadow: '0 14px 32px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Ração por dia
              </div>
              <h2 style={{ margin: '6px 0 0', fontSize: 22, color: 'var(--text-primary)' }}>Acompanhamento por viveiro</h2>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {topConsumer ? (
                <>
                  Maior consumo: <strong style={{ color: 'var(--text-primary)' }}>{topConsumer.pondCode}</strong> · {fmt(topConsumer.dailyFeedKg, 1)} kg
                </>
              ) : (
                'Sem consumo registrado hoje'
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ borderRadius: 18, padding: 14, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total do dia</div>
              <div style={{ marginTop: 8, color: 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>
                {fmt(feedingTable?.totals.dailyFeedKg ?? 0, 1)} kg
              </div>
            </div>
            <div style={{ borderRadius: 18, padding: 14, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acumulado</div>
              <div style={{ marginTop: 8, color: 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>
                {fmt(feedingTable?.totals.racaoAcumuladaKg ?? 0, 1)} kg
              </div>
            </div>
            <div style={{ borderRadius: 18, padding: 14, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sem trato hoje</div>
              <div style={{ marginTop: 8, color: 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>
                {fmt(zeroFeedCount, 0)}
              </div>
            </div>
          </div>

          <Table
            columns={feedingColumns}
            data={sortedRows}
            rowKey={(row) => row.pondId}
            loading={feedingLoading}
            emptyMessage="Ainda não há consumo registrado para hoje"
          />
        </section>

        <aside style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
          <section
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: 18,
              boxShadow: '0 14px 32px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Biometrias
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 20, color: 'var(--text-primary)' }}>
              Base para definir a dieta
            </h2>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <InfoLine label="Lote ativo" value={activeCycles[0]?.lotCode ?? 'Sem lote ativo'} />
              <InfoLine label="Peso médio" value={biometricKpis ? `${fmt(biometricKpis.pesoMedioG ?? 0, 1)} g` : '—'} />
              <InfoLine label="Sobrevivência" value={biometricKpis?.survivalPct != null ? `${fmt(biometricKpis.survivalPct, 1)}%` : '—'} />
              <InfoLine label="Biomassa atual" value={biometricKpis ? `${fmt(biometricKpis.biomassaAtualKg ?? 0, 1)} kg` : '—'} />
              <InfoLine label="Biometrias registradas" value={fmt(biometrics.length, 0)} />
            </div>
            <Link
              to="/biometrias"
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Abrir biometrias
            </Link>
          </section>

          <section
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: 18,
              boxShadow: '0 14px 32px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Qualidade da água
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 20, color: 'var(--text-primary)' }}>
              Último ponto do ciclo
            </h2>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <InfoLine label="Viveiro" value={latestPond?.code ?? '—'} />
              <InfoLine label="Última leitura" value={fmtDate(latestWaterQuality?.measuredAt)} />
              <InfoLine label="Oxigênio" value={latestWaterQuality ? `${fmt(latestWaterQuality.oxygenMgL, 1)} mg/L` : '—'} />
              <InfoLine label="pH" value={latestWaterQuality ? fmt(latestWaterQuality.ph, 2) : '—'} />
              <InfoLine label="Alertas" value={latestWaterQuality?.outOfRange ? latestWaterQuality.outOfRangeParams.join(', ') : 'Sem alerta'} />
            </div>
            <Link
              to="/water-quality"
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Abrir qualidade
            </Link>
          </section>

        </aside>
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 14,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
