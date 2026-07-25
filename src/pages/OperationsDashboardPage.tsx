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
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceCardAction,
  workspaceEyebrow,
  workspaceMetricValue,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces'
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
      key: 'fca',
      header: 'FCA',
      align: 'right' as const,
      render: (row: FeedingTableRow) =>
        row.fca == null ? '—' : fmt(row.fca, 2),
    },
  ]

  return (
    <div style={pageStack}>
      <section style={workspaceSurface}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.section }}>
          <div style={{ ...workspaceEyebrow, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} />
            Painel operacional
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: space.tile }}>
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                style={{
                  ...workspaceTile,
                  display: 'flex',
                  alignItems: 'center',
                  gap: space.tile,
                  padding: 14,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.control,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent-dark)',
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{action.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{action.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={metricGrid}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{ ...workspaceSurface, padding: '16px 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.tile }}>
              <div style={workspaceTileLabel}>
                {card.label}
              </div>
              <div style={{ color: 'var(--accent-dark)', display: 'inline-flex' }}>{card.icon}</div>
            </div>
            <div style={{ ...workspaceMetricValue, marginTop: 10 }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.page }}>
        <section style={workspaceCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={workspaceTileLabel}>
                Ração por dia
              </div>
              <h2 style={{ ...sectionTitle, marginTop: 6 }}>Acompanhamento por viveiro</h2>
            </div>
            <div style={sectionSubtitle}>
              {topConsumer ? (
                <>
                  Maior consumo: <strong style={{ color: 'var(--text-primary)' }}>{topConsumer.pondCode}</strong> · {fmt(topConsumer.dailyFeedKg, 1)} kg
                </>
              ) : (
                'Sem consumo registrado hoje'
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile }}>
            <div style={workspaceTile}>
              <div style={workspaceTileLabel}>Total do dia</div>
              <div style={workspaceTileValue}>
                {fmt(feedingTable?.totals.dailyFeedKg ?? 0, 1)} kg
              </div>
            </div>
            <div style={workspaceTile}>
              <div style={workspaceTileLabel}>Acumulado</div>
              <div style={workspaceTileValue}>
                {fmt(feedingTable?.totals.racaoAcumuladaKg ?? 0, 1)} kg
              </div>
            </div>
            <div style={workspaceTile}>
              <div style={workspaceTileLabel}>Sem trato hoje</div>
              <div style={workspaceTileValue}>
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

        <aside style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: space.page, alignItems: 'start' }}>
          <section style={workspaceSurface}>
            <div style={workspaceTileLabel}>
              Biometrias
            </div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>
              Base para definir a dieta
            </h2>
            <div style={{ marginTop: space.section, display: 'grid', gap: space.inline }}>
              <InfoLine label="Lote ativo" value={activeCycles[0]?.lotCode ?? 'Sem lote ativo'} />
              <InfoLine label="Peso médio" value={biometricKpis ? `${fmt(biometricKpis.pesoMedioG ?? 0, 1)} g` : '—'} />
              <InfoLine label="Sobrevivência" value={biometricKpis?.survivalPct != null ? `${fmt(biometricKpis.survivalPct, 1)}%` : '—'} />
              <InfoLine label="Biomassa atual" value={biometricKpis ? `${fmt(biometricKpis.biomassaAtualKg ?? 0, 1)} kg` : '—'} />
              <InfoLine label="Biometrias registradas" value={fmt(biometrics.length, 0)} />
            </div>
            <Link
              to="/biometrias"
              style={{ ...workspaceCardAction, marginTop: space.section }}
            >
              Abrir biometrias
            </Link>
          </section>

          <section style={workspaceSurface}>
            <div style={workspaceTileLabel}>
              Qualidade da água
            </div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>
              Último ponto do ciclo
            </h2>
            <div style={{ marginTop: space.section, display: 'grid', gap: space.inline }}>
              <InfoLine label="Viveiro" value={latestPond?.code ?? '—'} />
              <InfoLine label="Última leitura" value={fmtDate(latestWaterQuality?.measuredAt)} />
              <InfoLine label="Oxigênio" value={latestWaterQuality ? `${fmt(latestWaterQuality.oxygenMgL, 1)} mg/L` : '—'} />
              <InfoLine label="pH" value={latestWaterQuality ? fmt(latestWaterQuality.ph, 2) : '—'} />
              <InfoLine label="Alertas" value={latestWaterQuality?.outOfRange ? latestWaterQuality.outOfRangeParams.join(', ') : 'Sem alerta'} />
            </div>
            <Link
              to="/water-quality"
              style={{ ...workspaceCardAction, marginTop: space.section }}
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
        ...workspaceTile,
        display: 'flex',
        justifyContent: 'space-between',
        gap: space.tile,
        padding: '10px 12px',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
