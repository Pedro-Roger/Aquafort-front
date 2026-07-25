import { useEffect, useRef, useState } from 'react';
import { Activity, CalendarDays, LineChart, Waves } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart as RechartsLineChart,
} from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCycles } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
import { useBiometricKpis, useBiometrics, useBiometricSeries, useCreateBiometric, useDeleteBiometric, useLatestBiometricsByPond } from '../hooks/useBiometrics';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { KPICard } from '../components/ui/KPICard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import {
  metricGrid,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceLink,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import { CycleWorkspacePanel } from '../components/ponds/CycleWorkspacePanel';
import { BiometricsPondsGrid } from '../components/biometrics/BiometricsPondsGrid';
import { BiometricsModalForm } from '../components/biometrics/BiometricsModalForm';
import type { Biometric, Pond } from '../types';
import {
  buildBiometriaCards,
  buildBiometriaPath,
  buildBiometriaQuickActions,
  buildBiometriaSnapshot,
  calculateBiometricsOperationalEstimate,
  getConsumptionPctForWeight,
} from './biometrias';
import { buildDespescaPath } from './despesca';
import { calculateProductivity, daysSince } from '../lib/productivity';

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BiometricsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const { data: ponds = [], isLoading: pondsLoading } = usePonds();
  const { data: latestByPond = [] } = useLatestBiometricsByPond();
  const [cycleId, setCycleId] = useState(() => searchParams.get('cycleId') ?? '');
  const selectedCycleId = cycleId || cycles[0]?.id || '';
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;
  const focusParam = searchParams.get('focus');
  const { reference } = useFarmBiometricsReference();
  const [form, setForm] = useState({
    measuredAt: todayIsoDate(),
    sampleCount: '',
    averageWeightG: '',
    survivalRatePct: '',
    estimatedBiomass: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);

  const biometrics = useBiometrics(selectedCycleId || null);
  const series = useBiometricSeries(selectedCycleId || null);
  const kpis = useBiometricKpis(selectedCycleId || null);
  const createBiometric = useCreateBiometric();
  const deleteBiometric = useDeleteBiometric();

  async function handleSave() {
    if (!selectedCycleId || !form.measuredAt || !form.sampleCount || !form.averageWeightG) return;

    await createBiometric.mutateAsync({
      cycleId: selectedCycleId,
      measuredAt: form.measuredAt,
      sampleCount: Number(form.sampleCount),
      averageWeightG: Number(form.averageWeightG),
      survivalRatePct: form.survivalRatePct ? Number(form.survivalRatePct) : undefined,
      estimatedBiomass: form.estimatedBiomass ? Number(form.estimatedBiomass) : undefined,
    });

    setForm({
      measuredAt: todayIsoDate(),
      sampleCount: '',
      averageWeightG: '',
      survivalRatePct: '',
      estimatedBiomass: '',
    });
  }

  async function handleModalSubmit(data: {
    measuredAt: string;
    sampleCount: number;
    averageWeightG: number;
    survivalRatePct?: number;
    estimatedBiomass?: number;
  }) {
    setForm({
      measuredAt: data.measuredAt,
      sampleCount: String(data.sampleCount),
      averageWeightG: String(data.averageWeightG),
      survivalRatePct: data.survivalRatePct ? String(data.survivalRatePct) : '',
      estimatedBiomass: data.estimatedBiomass ? String(data.estimatedBiomass) : '',
    });

    if (!selectedCycleId || !data.measuredAt || !data.sampleCount || !data.averageWeightG) return;

    await createBiometric.mutateAsync({
      cycleId: selectedCycleId,
      measuredAt: data.measuredAt,
      sampleCount: data.sampleCount,
      averageWeightG: data.averageWeightG,
      survivalRatePct: data.survivalRatePct,
      estimatedBiomass: data.estimatedBiomass,
    });

    setForm({
      measuredAt: todayIsoDate(),
      sampleCount: '',
      averageWeightG: '',
      survivalRatePct: '',
      estimatedBiomass: '',
    });
    setModalOpen(false);
  }

  function handlePondClick(pond: Pond) {
    setSelectedPond(pond);
    setModalOpen(true);
  }

  const cycleOptions = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.pond?.code ?? cycle.pondId} · ${cycle.lotCode ?? cycle.larvaeLotCode ?? cycle.supplier}`,
  }));
  const cycleAgeDays = selectedCycle?.stockDate ? daysSince(selectedCycle.stockDate) : 0;
  const productivity = calculateProductivity({
    biomassKg: kpis.data?.biomassaAtualKg ?? 0,
    areaHa: Number(selectedCycle?.pond?.areaHa ?? 0),
    days: cycleAgeDays,
  });
  const summaryCards = buildBiometriaCards({
    pesoMedioG: kpis.data?.pesoMedioG,
    survivalPct: kpis.data?.survivalPct,
    biomassaAtualKg: kpis.data?.biomassaAtualKg,
    racaoConsumidaKg: kpis.data?.racaoConsumidaKg,
    fca: kpis.data?.fca,
    kgPerHaPerDay: productivity.kgPerHaPerDay,
  });
  const latestPoint = series.data?.points?.at(-1) ?? null;
  const operationalEstimate = calculateBiometricsOperationalEstimate({
    averageWeightG: latestPoint?.pesoMedioG ?? kpis.data?.pesoMedioG ?? 0,
    racaoConsumidaKg: kpis.data?.racaoConsumidaKg ?? 0,
    plCount: selectedCycle?.plCount ?? 0,
    reference,
  });
  const operationalConsumptionPct = getConsumptionPctForWeight(operationalEstimate.weightG, reference);
  const selectedCycleLabel = cycleOptions.find((option) => option.value === selectedCycleId)?.label ?? '—';
  const quickActions = buildBiometriaQuickActions();
  const quickLinks = [
    { to: '/dashboard', label: 'Voltar ao painel' },
    { to: '/tanques', label: 'Viveiros' },
    { to: '/povoamento', label: 'Povoamento' },
    { to: '/nutrition', label: 'Ração' },
    { to: '/water-quality', label: 'Qualidade' },
  ];
  const snapshot = buildBiometriaSnapshot({
    cycleLabel: selectedCycleLabel,
    totalReadings: biometrics.data?.length ?? 0,
    latestReadingAt: biometrics.data?.[0]?.measuredAt ?? null,
    latestWeightG: latestPoint?.pesoMedioG ?? null,
    survivalPct: kpis.data?.survivalPct ?? null,
  });
  const cyclePanelMetrics = snapshot.slice(1, 5);
  const latestBiometricsByPond = Object.fromEntries(
    latestByPond.map((reading) => [
      reading.pondId,
      { measuredAt: reading.measuredAt, pesoMedioG: reading.averageWeightG },
    ]),
  );

  useEffect(() => {
    if (focusParam === 'form') {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (focusParam === 'chart') {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusParam]);

  const columns = [
    {
      key: 'measuredAt',
      header: 'Data',
      render: (row: Biometric) => new Date(row.measuredAt).toLocaleDateString('pt-BR'),
    },
    {
      key: 'sampleCount',
      header: 'Amostras',
      align: 'right' as const,
      render: (row: Biometric) => row.sampleCount,
    },
    {
      key: 'averageWeightG',
      header: 'Peso medio',
      align: 'right' as const,
      render: (row: Biometric) => `${fmt(row.averageWeightG, 2)} g`,
    },
    {
      key: 'survivalRatePct',
      header: 'Sobrev.',
      align: 'right' as const,
      render: (row: Biometric) => row.survivalRatePct != null ? `${fmt(Number(row.survivalRatePct), 1)} %` : '—',
    },
    {
      key: 'estimatedBiomass',
      header: 'Biomassa',
      align: 'right' as const,
      render: (row: Biometric) => row.estimatedBiomass != null ? `${fmt(Number(row.estimatedBiomass), 2)} kg` : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: Biometric) => (
        <button
          onClick={() => deleteBiometric.mutate({ id: row.id, cycleId: selectedCycleId })}
          style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}
        >
          Excluir
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
      <div
        style={{
          ...workspaceSurface,
        }}
      >
        <div style={{ display: 'grid', gap: 16, alignItems: 'start' }}>
          <CycleWorkspacePanel
            eyebrow="Ciclo ativo"
            title="Painel de leitura"
            description="O mesmo contexto acompanha a biometria, a curva e a transição para despesca."
            cycleOptions={cycleOptions}
            selectedCycleId={selectedCycleId}
            onCycleChange={(nextCycleId) => {
              setCycleId(nextCycleId);
              navigate(buildBiometriaPath(nextCycleId, focusParam === 'chart' ? 'chart' : focusParam === 'form' ? 'form' : undefined), { replace: true });
            }}
            metrics={cyclePanelMetrics}
            actions={quickActions.map((action) => ({
              label: action.label,
              kind: action.kind,
              onClick: () => {
                if (action.action === 'focus-form') {
                  navigate(buildBiometriaPath(selectedCycleId, 'form'));
                  return;
                }
                if (action.action === 'focus-chart') {
                  chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  return;
                }
                if (action.action === 'navigate-despesca') {
                  navigate(buildDespescaPath(selectedCycleId, 'chart'));
                  return;
                }
                if (action.action === 'navigate-tanques') {
                  navigate('/tanques');
                }
              },
            }))}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline, marginTop: space.section }}>
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

      <section style={workspaceCard}>
        <div>
          <div style={workspaceTileLabel}>Leitura por viveiro</div>
          <h2 style={{ ...sectionTitle, marginTop: 6 }}>Clique para registrar biometria</h2>
        </div>
        <BiometricsPondsGrid
          ponds={ponds}
          loading={pondsLoading}
          onPondClick={handlePondClick}
          latestBiometricsByPond={latestBiometricsByPond}
        />
      </section>

      <div style={metricGrid}>
        {summaryCards.map((card) => (
          <KPICard
            key={card.label}
            label={card.label}
            value={card.value}
            unit={card.unit}
            icon={card.label === 'Peso médio' ? <LineChart size={16} /> : card.label === 'Sobrevivência' ? <Activity size={16} /> : card.label === 'Biomassa atual' ? <Waves size={16} /> : card.label === 'Ração consumida' ? <CalendarDays size={16} /> : undefined}
            color={card.tone === 'blue' ? '#0ea5e9' : card.tone === 'green' ? '#38bdf8' : card.tone === 'amber' ? '#7dd3fc' : card.tone === 'red' ? '#1d4ed8' : '#64748b'}
          />
        ))}
      </div>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={workspaceTileLabel}>Estimativa operacional</div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>Biomassa e sobrevivência a partir da biometria</h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Base usada: {operationalConsumptionPct != null ? `${fmt(operationalConsumptionPct, 1)}% de consumo` : 'sem referência'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile }}>
          <InfoCard label="Peso médio usado" value={operationalEstimate.weightG > 0 ? `${fmt(operationalEstimate.weightG, 2)} g` : '—'} />
          <InfoCard label="Biomassa estimada" value={operationalEstimate.biomassKg != null ? `${fmt(operationalEstimate.biomassKg, 2)} kg` : '—'} />
          <InfoCard label="Camarões estimados" value={operationalEstimate.shrimpCount != null ? `${fmt(operationalEstimate.shrimpCount, 0)}` : '—'} />
          <InfoCard label="Sobrevivência estimada" value={operationalEstimate.survivalPct != null ? `${fmt(operationalEstimate.survivalPct, 2)} %` : '—'} />
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55 }}>
          A conta usa a tabela cadastrada em Configurações da fazenda. Exemplo prático: se o peso médio é 18g e o viveiro consome 120kg numa faixa de 1%,
          então a biomassa estimada é 12.000kg. O número de camarões é essa biomassa convertida em gramas dividida pelo peso médio, e a sobrevivência vem da
          comparação com o lote povoado.
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: space.page, minHeight: 0, flex: 1 }}>
        <div ref={formRef} style={workspaceCard}>
          <div>
            <h2 style={sectionTitle}>Registrar biometria</h2>
            <div style={{ ...sectionSubtitle, marginTop: 2 }}>Preencha a leitura para atualizar a curva operacional.</div>
          </div>
          <div style={{ display: 'grid', gap: space.tile }}>
            <Input label="Data" type="date" value={form.measuredAt} onChange={(e) => setForm((current) => ({ ...current, measuredAt: e.target.value }))} />
            <Input label="Amostras" type="number" value={form.sampleCount} onChange={(e) => setForm((current) => ({ ...current, sampleCount: e.target.value }))} />
            <Input label="Peso médio (g)" type="number" step="0.01" value={form.averageWeightG} onChange={(e) => setForm((current) => ({ ...current, averageWeightG: e.target.value }))} />
            <Input label="Sobrevivência (%)" type="number" step="0.01" value={form.survivalRatePct} onChange={(e) => setForm((current) => ({ ...current, survivalRatePct: e.target.value }))} />
            <Input label="Biomassa (kg) opcional" type="number" step="0.01" value={form.estimatedBiomass} onChange={(e) => setForm((current) => ({ ...current, estimatedBiomass: e.target.value }))} />
            <Button loading={createBiometric.isPending} onClick={handleSave} disabled={!selectedCycleId || !form.sampleCount || !form.averageWeightG}>
              Salvar biometria
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: '280px minmax(0, 1fr)', gap: space.page, minHeight: 0 }}>
          <div ref={chartRef} style={workspaceCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
              <div>
                <h2 style={sectionTitle}>Curva de crescimento</h2>
                <div style={{ ...sectionSubtitle, marginTop: 2 }}>Eixo por semana com peso médio e ganho semanal.</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{series.data?.points.length ?? 0} pontos</span>
            </div>
            {!series.data?.points.length ? (
              <EmptyState
                compact
                title="Sem pontos ainda."
                description="Registre uma biometria para desenhar a curva."
              />
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <RechartsLineChart data={series.data.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="semana" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => {
                        const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                        return name === 'pesoMedioG'
                          ? [`${fmt(numericValue, 2)} g`, 'Peso médio']
                          : [`${fmt(numericValue, 2)} g`, 'Ganho semanal'];
                      }}
                      labelFormatter={(value) => `Semana ${value}`}
                    />
                <Line type="monotone" dataKey="pesoMedioG" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ganhoSemanaG" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={{ ...workspaceCard, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
              <h2 style={sectionTitle}>Histórico</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {biometrics.data?.length ?? 0} registros{biometrics.data?.[0] ? ` · último em ${new Date(biometrics.data[0].measuredAt).toLocaleDateString('pt-BR')}` : ''}
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Table columns={columns} data={biometrics.data ?? []} rowKey={(row) => row.id} loading={biometrics.isLoading || deleteBiometric.isPending} emptyMessage="Nenhuma biometria registrada" />
            </div>
          </div>
        </div>
      </div>

      {selectedPond && (
        <BiometricsModalForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPond(null);
          }}
          pondCode={selectedPond.code || selectedPond.name || '—'}
          loading={createBiometric.isPending}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...workspaceTile, padding: '14px 16px' }}>
      <div style={workspaceTileLabel}>{label}</div>
      <div style={workspaceTileValue}>{value}</div>
    </div>
  );
}
