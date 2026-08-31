import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowRightLeft,
  ClipboardList,
  Fish,
  LayoutDashboard,
  Package,
} from 'lucide-react'
import { useBiometrics } from '../hooks/useBiometrics'
import { useCycles, useCyclesSummary } from '../hooks/useCycles'
import { useDashboardMetrics, useDashboards } from '../hooks/useDashboards'
import { useFeedingTable } from '../hooks/useFeeding'
import { usePonds } from '../hooks/usePonds'
import { useWaterQuality } from '../hooks/useWaterQuality'
import { Table } from '../components/ui/Table'
import { EmptyState } from '../components/ui/EmptyState'
import { PanelCard } from './CustomDashboardsPage'
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
import type { FeedingTableRow, PondStatus } from '../types'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
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
  const { data: waterQuality = [] } = useWaterQuality(activeCycles[0]?.id)
  // The most recently updated saved dashboard (Painéis customizáveis) previews
  // here — whatever the user configures there shows up on the home screen,
  // instead of/alongside the fixed biometria+água shortcut below.
  const { data: dashboards = [] } = useDashboards()
  const { data: dashboardMetrics = [] } = useDashboardMetrics()
  const featuredDashboard = dashboards[0]

  const rows = feedingTable?.rows ?? []
  const sortedRows = [...rows].sort((left, right) => right.dailyFeedKg - left.dailyFeedKg)
  const topConsumer = sortedRows[0]

  // RF-07/pedido do Yorvi na reunião (16/06/2026): acompanhamento por
  // gráfico em vez de linhas de "última leitura" estáticas. Fallback só para
  // quem ainda não salvou nenhum painel em /paineis — ver `featuredDashboard`.
  const biometricsChartData = [...(Array.isArray(biometrics) ? biometrics : [])]
    .sort((left, right) => new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime())
    .map((point) => ({
      date: new Date(point.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      pesoMedioG: Number(point.averageWeightG),
    }))
  const waterQualityChartData = [...(Array.isArray(waterQuality) ? waterQuality : [])]
    .sort((left, right) => new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime())
    .map((point) => ({
      date: new Date(point.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      oxygenMgL: Number(point.oxygenMgL),
      ph: Number(point.ph),
    }))
  const zeroFeedCount = rows.filter((row) => row.dailyFeedKg === 0).length

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

        {featuredDashboard && featuredDashboard.panels.length > 0 ? (
          <div style={{ display: 'grid', gap: space.page }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: space.page, alignItems: 'start' }}>
              {featuredDashboard.panels.map((panel) => (
                <PanelCard key={panel.id} panel={panel} metrics={dashboardMetrics} />
              ))}
            </div>
            <Link to="/paineis" style={workspaceCardAction}>
              Editar "{featuredDashboard.name}" em Painéis
            </Link>
          </div>
        ) : (
          <aside style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: space.page, alignItems: 'start' }}>
          <section style={workspaceSurface}>
            <div style={workspaceTileLabel}>
              Biometrias
            </div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>
              Peso médio ao longo do ciclo
            </h2>
            {biometricsChartData.length === 0 ? (
              <EmptyState compact title="Sem biometria ainda." description="Registre uma leitura para desenhar o gráfico." />
            ) : (
              <div style={{ width: '100%', height: 200, marginTop: space.section }}>
                <ResponsiveContainer>
                  <LineChart data={biometricsChartData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={40} />
                    <Tooltip
                      formatter={(value: unknown) => [`${fmt(Number(value), 2)} g`, 'Peso médio']}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: radius.tile }}
                    />
                    <Line type="monotone" dataKey="pesoMedioG" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
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
              Oxigênio e pH ao longo do ciclo
            </h2>
            {waterQualityChartData.length === 0 ? (
              <EmptyState compact title="Sem medição ainda." description="Registre uma leitura para desenhar o gráfico." />
            ) : (
              <div style={{ width: '100%', height: 200, marginTop: space.section }}>
                <ResponsiveContainer>
                  <LineChart data={waterQualityChartData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: radius.tile }}
                    />
                    <Line type="monotone" dataKey="oxygenMgL" name="Oxigênio (mg/L)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ph" name="pH" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <Link
              to="/water-quality"
              style={{ ...workspaceCardAction, marginTop: space.section }}
            >
              Abrir qualidade
            </Link>
          </section>
          </aside>
        )}
      </div>
    </div>
  )
}
