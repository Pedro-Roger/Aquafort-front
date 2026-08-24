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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCycles } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
import { useBiometricKpis, useBiometrics, useBiometricSeries, useCreateBiometric, useDeleteBiometric, useLatestBiometricsByPond } from '../hooks/useBiometrics';
import { useFeedingAggregate } from '../hooks/useFeeding';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { KPICard } from '../components/ui/KPICard';
import { Table } from '../components/ui/Table';
import {
  metricGrid,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import { CycleWorkspacePanel } from '../components/ponds/CycleWorkspacePanel';
import { BiometricsPondsGrid } from '../components/biometrics/BiometricsPondsGrid';
import { BiometricsListEntry, type BiometricsListRow } from '../components/biometrics/BiometricsListEntry';
import { BiometricsModalForm } from '../components/biometrics/BiometricsModalForm';
import type { Biometric, Pond } from '../types';
import {
  averageWeightGToPlPerGram,
  buildBiometriaCards,
  buildBiometriaPath,
  buildBiometriaSnapshot,
  buildBiometricPayload,
  calculateBiometricsOperationalEstimate,
  getConsumptionPctForWeight,
  isBercarioPondType,
  isBiometricFormValid,
  type BiometricFormValues,
} from './biometrias';
import { calculateProductivity, daysSince } from '../lib/productivity';
import { formatDateOnly } from '../lib/format';

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** ISO date `days` ago (0 = today), for a short feeding window — see `useFeedingAggregate`. */
function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function BiometricsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const { data: ponds = [], isLoading: pondsLoading } = usePonds();
  const { data: latestByPond = [] } = useLatestBiometricsByPond();
  const [cycleId, setCycleId] = useState(() => searchParams.get('cycleId') ?? '');
  const selectedCycleId = cycleId || cycles[0]?.id || '';
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;
  /** RF-10/RN-10: bercario cycles read biometry as PL/g; engorda/reprodutor keep grams. */
  const isBercario = isBercarioPondType(selectedCycle?.pond?.type);
  const focusParam = searchParams.get('focus');
  const { reference } = useFarmBiometricsReference();
  // Lançamento em lote (padrão) — a fazenda raramente é toda medida no mesmo
  // dia, então a lista salva biometria por viveiro, independentemente.
  const [viewMode, setViewMode] = useState<'lista' | 'cartoes'>('lista');
  const [listDate, setListDate] = useState(() => isoDateDaysAgo(0));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  /** The active cycle of the pond that opened the modal — never the sidebar's selectedCycleId (bug: a click used to write into whatever cycle happened to be selected in the dropdown). */
  const [modalCycleId, setModalCycleId] = useState<string | null>(null);
  /** RF-10/RN-10: the pond that opened the modal decides its unit, straight off the pond object — same rule as the sidebar, just a different pond. */
  const isModalBercario = isBercarioPondType(selectedPond?.type);

  const biometrics = useBiometrics(selectedCycleId || null);
  const series = useBiometricSeries(selectedCycleId || null);
  const kpis = useBiometricKpis(selectedCycleId || null);
  // The operational estimate below reverse-computes biomass from feed ÷
  // today's expected consumption rate — valid only for feed given recently,
  // not the lifetime-accumulated total (see useFeedingAggregate's comment).
  const recentFeed = useFeedingAggregate(selectedCycleId || null, {
    from: isoDateDaysAgo(6),
    to: isoDateDaysAgo(0),
  });
  const createBiometric = useCreateBiometric();
  const deleteBiometric = useDeleteBiometric();

  async function submitBiometric(cycleId: string | null, values: BiometricFormValues) {
    if (!cycleId || !isBiometricFormValid(values)) return;

    await createBiometric.mutateAsync(buildBiometricPayload(cycleId, values, user?.id));
  }

  async function handleModalSubmit(data: BiometricFormValues) {
    // RF-10 (revisado)/RF-11: the modal already resolves averageWeightG to
    // grams itself — PL/g vs. peso direto is now a per-submit toggle the
    // operator picks inside the modal (RN-12), not something derivable from
    // pond type alone, so no conversion happens again here.
    await submitBiometric(modalCycleId, data);
    setModalOpen(false);
    setSelectedPond(null);
    setModalCycleId(null);
  }

  async function handleListSave(cycleId: string, weightG: number) {
    await createBiometric.mutateAsync({
      cycleId,
      measuredAt: listDate,
      averageWeightG: weightG,
      responsibleId: user?.id,
    });
  }

  function handlePondClick(pond: Pond) {
    // Bug fix: the modal used to save into the sidebar's selectedCycleId,
    // not the clicked pond's own cycle — resolve it here instead.
    const activeCycle = cycles.find((cycle) => cycle.pondId === pond.id) ?? null;
    setSelectedPond(pond);
    setModalCycleId(activeCycle?.id ?? null);
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
    racaoConsumidaKg: recentFeed.data?.racaoAcumuladaKg ?? 0,
    plCount: selectedCycle?.plCount ?? 0,
    reference,
  });
  const operationalConsumptionPct = getConsumptionPctForWeight(operationalEstimate.weightG, reference);
  const selectedCycleLabel = cycleOptions.find((option) => option.value === selectedCycleId)?.label ?? '—';
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
  const listRows: BiometricsListRow[] = ponds.map((pond) => {
    const activeCycle = cycles.find((cycle) => cycle.pondId === pond.id) ?? null;
    const latest = latestBiometricsByPond[pond.id];
    return {
      pondId: pond.id,
      pondCode: pond.code || pond.name || '—',
      cycleId: activeCycle?.id ?? null,
      previousWeightG: latest?.pesoMedioG ?? null,
      previousDate: latest?.measuredAt ?? null,
    };
  });

  useEffect(() => {
    // The sidebar form this used to scroll to is gone — deep links with
    // focus=form (e.g. from HarvestPlanningPage) now open the same
    // pond-click modal instead, for the currently selected cycle's pond.
    if (focusParam === 'form') {
      const pond = cycles.find((cycle) => cycle.id === selectedCycleId)?.pond;
      if (pond) handlePondClick(pond as Pond);
    }
    if (focusParam === 'chart') {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam, selectedCycleId, cycles]);

  const columns = [
    {
      key: 'measuredAt',
      header: 'Data',
      render: (row: Biometric) => formatDateOnly(row.measuredAt),
    },
    {
      key: 'pond',
      header: 'Viveiro',
      render: () => selectedCycle?.pond?.code || selectedCycle?.pond?.name || '—',
    },
    {
      key: 'sampleCount',
      header: 'Amostras',
      align: 'right' as const,
      render: (row: Biometric) => row.sampleCount ?? '—',
    },
    // RF-10/RN-10: bercario reads/reports in PL/g, not grams — showing both
    // side by side asked the operator to convert one of them in their head.
    isBercario
      ? {
          key: 'plPerGram',
          header: 'PL/g',
          align: 'right' as const,
          render: (row: Biometric) =>
            row.averageWeightG > 0 ? `${fmt(averageWeightGToPlPerGram(row.averageWeightG), 0)} PL/g` : '—',
        }
      : {
          key: 'averageWeightG',
          header: 'Peso médio',
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
      key: 'responsible',
      header: 'Responsável',
      render: (row: Biometric) => <span>{row.responsible?.name ?? '—'}</span>,
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
            actions={[]}
          />
        </div>
      </div>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.tile, flexWrap: 'wrap' }}>
          <div>
            <div style={workspaceTileLabel}>Leitura por viveiro</div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>
              {viewMode === 'lista' ? 'Lance a biometria do dia, viveiro por viveiro' : 'Clique para registrar biometria'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: viewMode === 'lista' ? 'none' : '1px solid var(--border-strong)',
                backgroundColor: viewMode === 'lista' ? 'var(--accent-fill)' : 'var(--bg-card)',
                color: viewMode === 'lista' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cartoes')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: viewMode === 'cartoes' ? 'none' : '1px solid var(--border-strong)',
                backgroundColor: viewMode === 'cartoes' ? 'var(--accent-fill)' : 'var(--bg-card)',
                color: viewMode === 'cartoes' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cartões
            </button>
          </div>
        </div>

        {viewMode === 'lista' ? (
          <BiometricsListEntry rows={listRows} date={listDate} onDateChange={setListDate} onSave={handleListSave} />
        ) : (
          <BiometricsPondsGrid
            ponds={ponds}
            loading={pondsLoading}
            onPondClick={handlePondClick}
            latestBiometricsByPond={latestBiometricsByPond}
          />
        )}
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
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>Biomassa a partir da biometria</h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Base usada: {operationalConsumptionPct != null ? `${fmt(operationalConsumptionPct, 1)}% de consumo` : 'sem referência'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile }}>
          <InfoCard label="Peso médio usado" value={operationalEstimate.weightG > 0 ? `${fmt(operationalEstimate.weightG, 2)} g` : '—'} />
          <InfoCard label="Biomassa estimada" value={operationalEstimate.biomassKg != null ? `${fmt(operationalEstimate.biomassKg, 2)} kg` : '—'} />
          <InfoCard label="Camarões estimados" value={operationalEstimate.shrimpCount != null ? `${fmt(operationalEstimate.shrimpCount, 0)}` : '—'} />
        </div>
      </section>

      <div style={{ display: 'grid', gap: space.page }}>
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
                        if (name === 'pesoMedioG') {
                          // RF-12: bercario cycles show the derived PL/g next to the
                          // weight in grams for every point on the growth curve.
                          const weightLabel = isBercario && numericValue > 0
                            ? `${fmt(numericValue, 2)} g (${fmt(averageWeightGToPlPerGram(numericValue), 0)} PL/g)`
                            : `${fmt(numericValue, 2)} g`;
                          return [weightLabel, 'Peso médio'];
                        }
                        return [`${fmt(numericValue, 2)} g`, 'Ganho semanal'];
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

          <div style={workspaceCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
              <h2 style={sectionTitle}>Histórico</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {biometrics.data?.length ?? 0} registros{biometrics.data?.[0] ? ` · último em ${formatDateOnly(biometrics.data[0].measuredAt)}` : ''}
              </span>
            </div>
            <div style={{ maxHeight: 420 }}>
              <Table columns={columns} data={biometrics.data ?? []} rowKey={(row) => row.id} loading={biometrics.isLoading || deleteBiometric.isPending} emptyMessage="Nenhuma biometria registrada" />
            </div>
          </div>
      </div>

      {selectedPond && (
        <BiometricsModalForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPond(null);
            setModalCycleId(null);
          }}
          pondCode={selectedPond.code || selectedPond.name || '—'}
          loading={createBiometric.isPending}
          isBercario={isModalBercario}
          disabledReason={modalCycleId ? null : 'Este viveiro não tem ciclo ativo — não é possível registrar biometria.'}
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
