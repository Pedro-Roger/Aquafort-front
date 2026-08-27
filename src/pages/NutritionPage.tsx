import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  Clock3,
  Download,
  Edit3,
  History,
  Layers,
  Package,
  Plus,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useCycles } from '../hooks/useCycles';
import { useCreateExpressFeeding, useFcaSeries, useFeedingList, useFeedingTable, useFeedProducts, useUpdateFeeding } from '../hooks/useFeeding';
import { useBiometricKpis } from '../hooks/useBiometrics';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { calculateDailyRation } from '../lib/biometricsReference';
import { Button } from '../components/ui/Button';
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  shadow,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceLink,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import type { FeedingRecord, FeedingTableRow } from '../types';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentLocalDateTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fmt(value: number, digits = 1) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function NutritionPage() {
  const { user } = useAuth();
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const { data: products = [] } = useFeedProducts();
  const [date, setDate] = useState(todayIsoDate());
  const [cycleFilter, setCycleFilter] = useState('');
  const [launchOpen, setLaunchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyCycleId, setHistoryCycleId] = useState('');
  const [fcaCycleId, setFcaCycleId] = useState('');
  const [editingFeeding, setEditingFeeding] = useState<FeedingRecord | null>(null);
  const [form, setForm] = useState({
    cycleId: '',
    productId: '',
    feedKg: '',
    fedAt: currentLocalDateTime(),
    observation: '',
  });

  const table = useFeedingTable({ cycleId: cycleFilter || undefined, date });
  const { reference } = useFarmBiometricsReference();
  const history = useFeedingList({ cycleId: cycleFilter || undefined, limit: 12 });
  const createFeeding = useCreateExpressFeeding();
  const updateFeeding = useUpdateFeeding();

  const fcaSelectedCycleId = fcaCycleId || cycles[0]?.id || null;
  const fcaSeries = useFcaSeries(fcaSelectedCycleId);
  const fullHistory = useFeedingList({
    cycleId: historyCycleId || undefined,
    from: historyFrom ? `${historyFrom}T00:00:00.000Z` : undefined,
    to: historyTo ? `${historyTo}T23:59:59.999Z` : undefined,
    limit: 100,
  });

  const selectedCycleId = form.cycleId || cycles[0]?.id || '';
  const selectedProductId = form.productId || products[0]?.id || '';
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;
  const rows = table.data?.rows ?? [];

  const launchKpis = useBiometricKpis(launchOpen ? selectedCycleId || null : null);
  const suggestion = calculateDailyRation({
    plCount: selectedCycle?.plCount ?? 0,
    averageWeightG: launchKpis.data?.pesoMedioG ?? 0,
    survivalPct: launchKpis.data?.survivalPct ?? null,
    reference,
  });

  const spotlight = rows[0] ?? null;
  const pondDistribution = rows
    .slice()
    .sort((a, b) => b.dailyFeedKg - a.dailyFeedKg)
    .slice(0, 8)
    .map((row) => ({
      pond: row.pondCode,
      consumoDia: Number(row.dailyFeedKg.toFixed(2)),
      acumulado: Number(row.racaoAcumuladaKg.toFixed(2)),
    }));

  const launchRhythm = useMemo(() => {
    return [...(history.data?.items ?? [])]
      .slice()
      .reverse()
      .map((item) => ({
        hora: new Date(item.fedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        kg: Number(item.feedKg.toFixed(2)),
      }))
      .slice(-8);
  }, [history.data?.items]);

  function exportHistoryCsv() {
    const items = fullHistory.data?.items ?? [];
    if (!items.length) return;

    const header = ['data', 'viveiro', 'produto', 'quantidade_kg', 'custo', 'responsavel', 'observacao'];
    const lines = items.map((item) => [
      new Date(item.fedAt).toLocaleString('pt-BR'),
      item.pond.code,
      item.product?.name ?? 'Mistura',
      String(item.feedKg).replace('.', ','),
      String(item.feedCost ?? 0).replace('.', ','),
      item.responsible?.name ?? '',
      item.observation ?? '',
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `historico-nutricao-${historyFrom || 'inicio'}-a-${historyTo || 'hoje'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleLaunch() {
    if (!user?.id || !selectedCycle || !selectedProductId || !form.feedKg || !form.fedAt) return;

    if (editingFeeding) {
      await updateFeeding.mutateAsync({
        id: editingFeeding.id,
        dto: {
          productId: selectedProductId,
          feedKg: Number(form.feedKg),
          fedAt: new Date(form.fedAt).toISOString(),
          responsibleId: user.id,
          observation: form.observation || undefined,
        },
      });
    } else {
      await createFeeding.mutateAsync({
        cycleId: selectedCycle.id,
        pondId: selectedCycle.pondId,
        productId: selectedProductId,
        feedKg: Number(form.feedKg),
        fedAt: new Date(form.fedAt).toISOString(),
        responsibleId: user.id,
        observation: form.observation || undefined,
      });
    }

    setForm((current) => ({
      ...current,
      cycleId: '',
      productId: '',
      feedKg: '',
      fedAt: currentLocalDateTime(),
      observation: '',
    }));
    setEditingFeeding(null);
    setLaunchOpen(false);
  }

  function handleEditFeeding(row: FeedingRecord) {
    setEditingFeeding(row);
    setForm({
      cycleId: row.cycleId,
      productId: row.product?.id ?? '',
      feedKg: String(row.feedKg),
      fedAt: toLocalDateTimeInput(row.fedAt),
      observation: row.observation ?? '',
    });
    setLaunchOpen(true);
  }

  const cycleOptions = [
    { value: '', label: 'Todos viveiros ativos' },
    ...cycles.map((cycle) => ({
      value: cycle.id,
      label: `${cycle.pond?.code ?? cycle.pondId} · ${cycle.lotCode ?? cycle.larvaeLotCode ?? cycle.supplier}`,
    })),
  ];

  const launchOptions = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.pond?.code ?? cycle.pondId} · ${cycle.pond?.name ?? 'Viveiro'}`,
  }));

  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.name,
  }));

  const quickLinks = [
    { to: '/dashboard', label: 'Voltar ao painel' },
    { to: '/povoamento', label: 'Povoamento' },
    { to: '/biometrias', label: 'Biometrias' },
    { to: '/water-quality', label: 'Qualidade' },
  ];

  const columns = [
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
      key: 'lastFedAt',
      header: 'Ultimo trato',
      render: (row: FeedingTableRow) => new Date(row.lastFedAt).toLocaleString('pt-BR'),
    },
    {
      key: 'responsible',
      header: 'Responsavel',
      render: (row: FeedingTableRow) => row.responsibleName,
    },
    {
      key: 'product',
      header: 'Produto',
      render: (row: FeedingTableRow) => row.productName,
    },
    {
      key: 'lastFeedKg',
      header: 'Ultimo',
      align: 'right' as const,
      render: (row: FeedingTableRow) => `${fmt(row.lastFeedKg, 2)} kg`,
    },
    {
      key: 'dailyFeedKg',
      header: 'Consumo dia',
      align: 'right' as const,
      render: (row: FeedingTableRow) => `${fmt(row.dailyFeedKg, 2)} kg`,
    },
    {
      key: 'racaoAcumuladaKg',
      header: 'Acumulado',
      align: 'right' as const,
      render: (row: FeedingTableRow) => `${fmt(row.racaoAcumuladaKg, 2)} kg`,
    },
    {
      key: 'biomassaKg',
      header: 'Biomassa',
      align: 'right' as const,
      render: (row: FeedingTableRow) => (row.biomassaKg == null ? '—' : `${fmt(row.biomassaKg, 1)} kg`),
    },
    {
      key: 'fca',
      header: 'FCA',
      align: 'right' as const,
      render: (row: FeedingTableRow) => (row.fca == null ? '—' : fmt(row.fca, 2)),
    },
  ];

  const historyColumns = [
    {
      key: 'fedAt',
      header: 'Data',
      render: (row: FeedingRecord) => new Date(row.fedAt).toLocaleString('pt-BR'),
    },
    {
      key: 'pond',
      header: 'Viveiro',
      render: (row: FeedingRecord) => row.pond.code,
    },
    {
      key: 'product',
      header: 'Produto',
      render: (row: FeedingRecord) => row.product?.name ?? 'Mistura',
    },
    {
      key: 'feedKg',
      header: 'Kg',
      align: 'right' as const,
      render: (row: FeedingRecord) => fmt(row.feedKg, 2),
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: FeedingRecord) => (
        <button
          type="button"
          onClick={() => handleEditFeeding(row)}
          title="Editar trato"
          style={{ border: 'none', background: 'none', color: 'var(--accent-dark)', cursor: 'pointer', display: 'inline-flex' }}
        >
          <Edit3 size={15} />
        </button>
      ),
    },
  ];

  const metrics = [
    { label: 'Consumo do dia', value: `${fmt(table.data?.totals.dailyFeedKg ?? 0, 2)} kg`, icon: <Activity size={18} /> },
    { label: 'Racao acumulada', value: `${fmt(table.data?.totals.racaoAcumuladaKg ?? 0, 1)} kg`, icon: <Layers size={18} /> },
    { label: 'Sacas projetadas', value: `${fmt(table.data?.totals.estimatedBagsUsed ?? 0, 2)} sc`, icon: <Package size={18} /> },
    { label: 'Viveiros em trato', value: `${rows.length}`, icon: <CalendarDays size={18} /> },
  ];

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.section }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.section, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={workspaceEyebrow}>Arraçoamento</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 170px auto auto', gap: space.inline, alignItems: 'end' }}>
              <div style={{ minWidth: 0 }}>
              <Select label="Filtro ciclo" options={cycleOptions} value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} />
              </div>
              <div style={{ minWidth: 0 }}>
                <Input label="Data base" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button
                variant="secondary"
                icon={<History size={16} />}
                onClick={() => setHistoryOpen(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                Histórico
              </Button>
              <Button
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingFeeding(null);
                  setForm({
                    cycleId: '',
                    productId: '',
                    feedKg: '',
                    fedAt: currentLocalDateTime(),
                    observation: '',
                  });
                  setLaunchOpen(true);
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Lancar trato
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline }}>
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={workspaceLink}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={workspaceTile}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={workspaceTileLabel}>{metric.label}</span>
                <span style={{ color: 'var(--accent-dark)', display: 'inline-flex' }}>{metric.icon}</span>
              </div>
              <div style={workspaceTileValue}>{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)', gap: space.page }}>
        <div style={workspaceCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.inline, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={sectionTitle}>Distribuicao de consumo por viveiro</h2>
              <div style={{ ...sectionSubtitle, marginTop: 2 }}>Barra para consumo do dia, linha para acumulado do ciclo.</div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{date}</div>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={pondDistribution} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="pond" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}kg`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}kg`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: radius.tile,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    boxShadow: shadow.raised,
                  }}
                />
                <Bar yAxisId="left" dataKey="consumoDia" fill="#0284c7" radius={[8, 8, 2, 2]} barSize={22} name="Consumo dia" />
                <Line yAxisId="right" dataKey="acumulado" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} name="Acumulado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={workspaceCard}>
          <div>
            <h2 style={sectionTitle}>Spotlight operacional</h2>
            <div style={{ ...sectionSubtitle, marginTop: 2 }}>Quem mais consumiu hoje e como esta o ritmo recente.</div>
          </div>

          <div
            style={{
              ...workspaceTile,
              padding: 16,
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent-soft-strong)',
            }}
          >
            <div style={workspaceTileLabel}>Maior consumo do dia</div>
            <div style={workspaceTileValue}>{spotlight?.pondCode ?? '-'}</div>
            <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{spotlight?.lotCode ?? 'Sem dados para a data base'}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
              <span>{spotlight ? `${fmt(spotlight.dailyFeedKg, 2)} kg hoje` : '-'}</span>
              <span>{spotlight ? `${fmt(spotlight.racaoAcumuladaKg, 1)} kg acum.` : '-'}</span>
            </div>
          </div>

          <div style={{ height: 180 }}>
            <ResponsiveContainer>
              <ComposedChart data={launchRhythm} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="hora" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}kg`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: radius.tile,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    boxShadow: shadow.raised,
                  }}
                />
                <Bar dataKey="kg" fill="#7c3aed" radius={[8, 8, 2, 2]} barSize={20} name="Lote lançado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: space.inline, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Clock3 size={16} />
            Ultimos {launchRhythm.length} lancamentos usados para leitura de ritmo.
          </div>
        </div>
      </div>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: space.tile, flexWrap: 'wrap' }}>
          <div>
            <div style={workspaceTileLabel}>Ração por dia</div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>
              Acompanhamento por viveiro
            </h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {table.data?.totals.dailyFeedKg === 0 ? 'Sem consumo registrado hoje' : `${fmt(table.data?.totals.dailyFeedKg ?? 0, 2)} kg hoje`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile }}>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Total do dia</div>
            <div style={workspaceTileValue}>{fmt(table.data?.totals.dailyFeedKg ?? 0, 1)} kg</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Acumulado</div>
            <div style={workspaceTileValue}>{fmt(table.data?.totals.racaoAcumuladaKg ?? 0, 1)} kg</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Sem trato hoje</div>
            <div style={workspaceTileValue}>
              {rows.length - rows.filter((r) => r.dailyFeedKg > 0).length}
            </div>
          </div>
        </div>
      </section>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
          <h2 style={sectionTitle}>
            Tabela de arraçoamento
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{table.data?.date ?? date}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: space.page, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.tile, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.inline, flexWrap: 'wrap' }}>
              <h3 style={sectionTitle}>Tabela principal</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Consumo e acumulado por viveiro</div>
            </div>
            <Table columns={columns} data={rows} rowKey={(row) => `${row.cycleId}:${row.pondId}`} loading={table.isLoading} emptyMessage="Sem tratos para ciclos ativos" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: space.tile, minWidth: 0 }}>
            <h3 style={sectionTitle}>Ultimos lancamentos</h3>
            <Table columns={historyColumns} data={history.data?.items ?? []} rowKey={(row) => row.id} loading={history.isLoading} emptyMessage="Nenhum lancamento ainda" />
          </div>
        </div>
      </section>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.inline, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <h2 style={sectionTitle}>FCA por tanque</h2>
            <div style={{ ...sectionSubtitle, marginTop: 2 }}>
              Conversão alimentar a cada biometria: ração acumulada sobre biomassa ganha.
            </div>
          </div>
          <div style={{ minWidth: 240 }}>
            <Select
              label="Tanque"
              options={launchOptions}
              value={fcaSelectedCycleId ?? ''}
              onChange={(e) => setFcaCycleId(e.target.value)}
            />
          </div>
        </div>

        {(fcaSeries.data?.points ?? []).length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Sem biometrias suficientes neste ciclo para calcular o FCA.
          </div>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={(fcaSeries.data?.points ?? []).map((point) => ({
                  semana: `S${point.week}`,
                  fca: point.fca,
                  biomassa: point.biomassaKg,
                  racao: point.racaoAcumuladaKg,
                }))}
                margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="semana" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}kg`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: radius.tile,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    boxShadow: shadow.raised,
                  }}
                />
                <Bar yAxisId="left" dataKey="racao" fill="#94a3b8" radius={[8, 8, 2, 2]} barSize={18} name="Ração acumulada (kg)" />
                <Bar yAxisId="left" dataKey="biomassa" fill="#0284c7" radius={[8, 8, 2, 2]} barSize={18} name="Biomassa (kg)" />
                <Line yAxisId="right" dataKey="fca" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="FCA" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Histórico de nutrição" width={780}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 150px 150px auto', gap: 10, alignItems: 'end' }}>
            <Select
              label="Viveiro / ciclo"
              options={cycleOptions}
              value={historyCycleId}
              onChange={(e) => setHistoryCycleId(e.target.value)}
            />
            <Input label="De" type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} />
            <Input label="Até" type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} />
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={exportHistoryCsv}
              disabled={!(fullHistory.data?.items ?? []).length}
              style={{ whiteSpace: 'nowrap' }}
            >
              Exportar CSV
            </Button>
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <Table
              columns={[
                ...historyColumns,
                {
                  key: 'responsible',
                  header: 'Responsável',
                  render: (row: FeedingRecord) => row.responsible?.name ?? '—',
                },
                {
                  key: 'observation',
                  header: 'Observação',
                  render: (row: FeedingRecord) => row.observation ?? '—',
                },
              ]}
              data={fullHistory.data?.items ?? []}
              rowKey={(row) => row.id}
              loading={fullHistory.isLoading}
              emptyMessage="Nenhum lançamento no período"
            />
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {fullHistory.data ? `${fullHistory.data.items.length} de ${fullHistory.data.total} lançamentos` : ''}
          </div>
        </div>
      </Modal>

      <Modal
        open={launchOpen}
        onClose={() => {
          setLaunchOpen(false);
          setEditingFeeding(null);
        }}
        title={editingFeeding ? 'Editar trato' : 'Novo trato'}
        width={560}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Select
            label="Viveiro / ciclo"
            options={launchOptions}
            value={selectedCycleId}
            disabled={!!editingFeeding}
            onChange={(e) => setForm((current) => ({ ...current, cycleId: e.target.value }))}
          />
          <Select
            label="Produto"
            options={productOptions}
            value={selectedProductId}
            onChange={(e) => setForm((current) => ({ ...current, productId: e.target.value }))}
          />
          <Input
            label="Quantidade (kg)"
            type="number"
            step="0.001"
            value={form.feedKg}
            onChange={(e) => setForm((current) => ({ ...current, feedKg: e.target.value }))}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            {suggestion.rationKg == null ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Sem biometria neste ciclo ainda — registre uma leitura para o sistema sugerir a ração do dia.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(2,132,199,0.06)',
                  border: '1px solid rgba(2,132,199,0.18)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    Sugestão do dia: {fmt(suggestion.rationKg, 2)} kg
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {fmt(suggestion.biomassKg ?? 0, 1)} kg de biomassa viva x {fmt(suggestion.consumptionPct ?? 0, 1)}% do peso
                    {launchKpis.data?.pesoMedioG != null ? ` · ultima biometria ${fmt(launchKpis.data.pesoMedioG, 2)} g` : ''}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setForm((current) => ({ ...current, feedKg: String(suggestion.rationKg) }))}
                >
                  Usar sugestão
                </Button>
              </div>
            )}
          </div>
          <Input
            label="Data / hora"
            type="datetime-local"
            value={form.fedAt}
            onChange={(e) => setForm((current) => ({ ...current, fedAt: e.target.value }))}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Observacao"
              value={form.observation}
              onChange={(e) => setForm((current) => ({ ...current, observation: e.target.value }))}
              placeholder="Ex.: coroa, cozinha, borda"
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Responsavel: {user?.name ?? 'Sem usuario'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setLaunchOpen(false);
                  setEditingFeeding(null);
                }}
              >
                Cancelar
              </Button>
              <Button loading={createFeeding.isPending || updateFeeding.isPending} onClick={handleLaunch} disabled={!user?.id || !selectedCycleId || !selectedProductId || !form.feedKg}>
                {editingFeeding ? 'Salvar edição' : 'Salvar trato'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
