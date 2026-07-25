import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, Gauge, Scale, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCycles } from '../hooks/useCycles';
import { useHarvestProjection, useRecomputeHarvestProjection } from '../hooks/useHarvestProjection';
import { KPICard } from '../components/ui/KPICard';
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  shadow,
  space,
  workspaceCard,
  workspaceSurface,
  workspaceTileLabel,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import { CycleWorkspacePanel, type CycleWorkspaceStatus } from '../components/ponds/CycleWorkspacePanel';
import type { Cycle, HarvestProjectionPoint } from '../types';
import { buildBiometriaPath } from './biometrias';
import { buildDespescaCards, buildDespescaPath, buildDespescaQuickActions, buildDespescaSnapshot } from './despesca';

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value?: number | null, digits = 1) {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

function cycleLabel(cycle: Cycle) {
  const pond = cycle.pond?.code ?? cycle.pondId.slice(0, 8);
  const lot = cycle.lotCode ?? cycle.larvaeLotCode ?? cycle.supplier;
  return `${pond} · ${lot}`;
}

type HarvestTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: HarvestProjectionPoint }>;
  label?: string | number;
};

function HarvestTooltip({ active, payload, label }: HarvestTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: radius.tile, padding: '10px 12px', fontSize: 12, boxShadow: shadow.raised }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Semana {label} · {formatDate(point.date)}</div>
      <div style={{ color: 'var(--accent)' }}>Custo: {formatMoney(point.costPerKg)}/kg</div>
      <div style={{ color: 'var(--accent-dark)' }}>Peso: {formatNumber(point.avgWeightG)}g</div>
      <div style={{ color: 'var(--text-secondary)' }}>Biomassa: {formatNumber(point.biomassKg, 0)} kg</div>
    </div>
  );
}

export function HarvestPlanningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles();
  const activeCycles = useMemo(() => cycles.filter((cycle) => cycle.status !== 'ENCERRADO'), [cycles]);
  const [selectedCycleId, setSelectedCycleId] = useState(() => searchParams.get('cycleId') ?? '');
  const selectedCycleIdValue = selectedCycleId || activeCycles[0]?.id || '';
  const selectedCycle = activeCycles.find((cycle) => cycle.id === selectedCycleIdValue) ?? null;
  const focusParam = searchParams.get('focus');
  const projection = useHarvestProjection(selectedCycle?.pondId ?? null, selectedCycle?.id);
  const recompute = useRecomputeHarvestProjection();
  const [projectionStatus, setProjectionStatus] = useState<CycleWorkspaceStatus | null>(null);

  const chartData = projection.data?.weeklyCurve ?? [];
  const projectionData = projection.data;
  const summaryCards = buildDespescaCards({
    optimalWeekStart: projectionData?.optimalWeekStart,
    optimalWeekEnd: projectionData?.optimalWeekEnd,
    idealDate: projectionData?.idealDate,
    idealWeightG: projectionData?.idealWeightG,
    minCostPerKg: projectionData?.minCostPerKg,
    confidence: projectionData?.confidence,
    assumptions: projectionData?.assumptions,
  });
  const quickActions = buildDespescaQuickActions();
  const selectedCycleLabel = selectedCycle ? cycleLabel(selectedCycle) : '—';
  const snapshot = buildDespescaSnapshot({
    cycleLabel: selectedCycleLabel,
    optimalWindow: projectionData?.optimalWeekStart != null && projectionData?.optimalWeekEnd != null
      ? `S${projectionData.optimalWeekStart}-S${projectionData.optimalWeekEnd}`
      : null,
    minCostPerKg: projectionData?.minCostPerKg ?? null,
    confidence: projectionData?.confidence ?? null,
    biometricPoints: projectionData?.assumptions?.biometricPoints ?? null,
  });
  const cyclePanelMetrics = snapshot.slice(0, 5);

  useEffect(() => {
    if (focusParam === 'chart') {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusParam]);

  useEffect(() => {
    if (projectionStatus?.tone !== 'success') return;
    const timeout = window.setTimeout(() => setProjectionStatus(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [projectionStatus]);

  async function handleRecompute() {
    if (!selectedCycle) return;

    setProjectionStatus({ tone: 'info', text: `Recalculando projeção para ${selectedCycleLabel}...` });
    try {
      await recompute.mutateAsync({ pondId: selectedCycle.pondId, cycleId: selectedCycle.id });
      setProjectionStatus({
        tone: 'success',
        text: `Projeção atualizada às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
      });
    } catch {
      setProjectionStatus({
        tone: 'warning',
        text: 'Não consegui atualizar agora. Tente novamente em alguns segundos.',
      });
    }
  }

  return (
    <div style={{ ...pageStack, height: '100%', overflow: 'hidden' }}>
      <div style={workspaceSurface}>
        <div style={{ display: 'grid', gap: space.section, alignItems: 'start' }}>
          <CycleWorkspacePanel
            eyebrow="Ciclo ativo"
            title="Painel de despesca"
            description="A mesma seleção do ciclo, as mesmas métricas e o estado de atualização da projeção."
            cycleOptions={activeCycles.map((cycle) => ({ value: cycle.id, label: cycleLabel(cycle) }))}
            selectedCycleId={selectedCycleIdValue}
            onCycleChange={(nextCycleId) => {
              setSelectedCycleId(nextCycleId);
              navigate(buildDespescaPath(nextCycleId, focusParam === 'chart' ? 'chart' : undefined), { replace: true });
            }}
            metrics={cyclePanelMetrics}
            status={projectionStatus}
            actions={quickActions.map((action) => ({
              label: action.label,
              kind: action.kind,
              loading: action.action === 'recompute' ? recompute.isPending : false,
              disabled:
                (action.action === 'recompute' && !selectedCycle) ||
                (action.action === 'focus-chart' && !projectionData),
              onClick: () => {
                if (action.action === 'recompute') {
                  void handleRecompute();
                  return;
                }
                if (action.action === 'navigate-biometrias') {
                  navigate(buildBiometriaPath(selectedCycleId, 'form'));
                  return;
                }
                if (action.action === 'navigate-tanques') {
                  navigate('/tanques');
                  return;
                }
                if (action.action === 'focus-chart') {
                  chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              },
            }))}
          />
        </div>
      </div>

      <div style={{ ...metricGrid }}>
        {summaryCards.map((card) => (
          <KPICard
            key={card.label}
            label={card.label}
            value={card.value}
            unit={card.unit}
            icon={card.label === 'Janela' ? <CalendarCheck size={18} /> : card.label === 'Data ideal' ? <TrendingUp size={18} /> : card.label === 'Peso ideal' ? <Scale size={18} /> : card.label === 'Confiança' ? <Gauge size={18} /> : undefined}
            color={card.tone === 'blue' ? '#0ea5e9' : card.tone === 'green' ? '#38bdf8' : card.tone === 'amber' ? '#7dd3fc' : '#64748b'}
          />
        ))}
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 340px', gap: space.page, overflow: 'hidden' }}>
        <div ref={chartRef} style={{ ...workspaceCard, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
            <div>
              <h2 style={sectionTitle}>Curva projetada</h2>
              <div style={{ ...sectionSubtitle, marginTop: 2 }}>Eixo por semana com custo por kg e peso estimado.</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>mínimo {formatMoney(projectionData?.minCostPerKg)}/kg</span>
          </div>

          <div style={{ flex: 1, minHeight: 260 }}>
            {projection.isLoading || cyclesLoading ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                <EmptyState title="Carregando..." icon={null} />
              </div>
            ) : !selectedCycle || !projectionData ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                <EmptyState
                  title="Sem ciclo ativo"
                  description="Selecione ou inicie um ciclo para ver a curva de despesca."
                />
              </div>
            ) : (
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `S${value}`} />
                  <YAxis yAxisId="cost" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} />
                  <YAxis yAxisId="weight" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}g`} />
                  <Tooltip content={<HarvestTooltip />} />
                  <ReferenceArea
                    yAxisId="cost"
                    x1={projectionData.optimalWeekStart}
                    x2={projectionData.optimalWeekEnd}
                    fill="rgba(14, 165, 233, 0.10)"
                    strokeOpacity={0}
                  />
                  <Line yAxisId="cost" type="monotone" dataKey="costPerKg" stroke="#0284c7" strokeWidth={2.2} dot={{ r: 3, fill: '#0284c7' }} name="R$/kg" />
                  <Line yAxisId="weight" type="monotone" dataKey="avgWeightG" stroke="#38bdf8" strokeWidth={1.8} dot={false} name="Peso" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.page, minHeight: 0 }}>
          <div style={workspaceCard}>
            <h2 style={sectionTitle}>Premissas</h2>
            {projectionData ? (
              <div style={{ display: 'grid', gap: space.inline }}>
                <Info label="Biometrias" value={String(projectionData.assumptions.biometricPoints)} />
                <Info label="Crescimento" value={`${formatNumber(projectionData.assumptions.growthRateGPerDay, 3)} g/dia`} />
                <Info label="Sobrevivência" value={`${formatNumber(projectionData.assumptions.survivalPct)}%`} />
                <Info label="Custo atual" value={formatMoney(projectionData.assumptions.currentCost)} />
                <Info label="Custo semanal" value={formatMoney(projectionData.assumptions.weeklyCost)} />
              </div>
            ) : (
              <EmptyState compact title="Sem projeção calculada ainda." />
            )}
          </div>

          <div style={workspaceCard}>
            <h2 style={sectionTitle}>Resumo rápido</h2>
            <div style={{ display: 'grid', gap: space.inline }}>
              {snapshot.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, fontSize: 13 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.detail}</div>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...workspaceSurface, padding: 0, overflow: 'hidden', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...workspaceTileLabel, padding: '11px 16px', borderBottom: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-elevated)' }}>Semanas</div>
            <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
              <table>
                <thead>
                  <tr style={{ ...workspaceTileLabel, borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 16px' }}>S</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right' }}>g</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right' }}>R$/kg</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point) => (
                    <tr key={point.week} style={{ borderTop: '1px solid var(--border)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      <td style={{ padding: '8px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>S{point.week}</td>
                      <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>{formatNumber(point.avgWeightG)}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', color: point.costPerKg === projectionData?.minCostPerKg ? 'var(--accent-dark)' : 'var(--text-secondary)', fontWeight: point.costPerKg === projectionData?.minCostPerKg ? 700 : 400 }}>
                        {formatMoney(point.costPerKg)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
