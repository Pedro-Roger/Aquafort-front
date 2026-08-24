import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Plus, Save, Trash2, X } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePonds } from '../hooks/usePonds';
import {
  useDashboardMetrics,
  useDashboards,
  useDeleteDashboard,
  useMetricScatter,
  useMetricSeries,
  useSaveDashboard,
} from '../hooks/useDashboards';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import {
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  shadow,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
} from '../components/ui/surfaces';
import type { DashboardChartType, DashboardMetric, DashboardPanel, DashboardXAxis } from '../types';

const SERIES_COLORS = ['#0284c7', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#38bdf8', '#d946ef', '#84cc16'];

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Linha' },
  { value: 'bar', label: 'Barra' },
  { value: 'area', label: 'Área' },
];

const X_AXIS_OPTIONS: { value: DashboardXAxis; label: string }[] = [
  { value: 'date', label: 'Data' },
  { value: 'week', label: 'Semana de cultivo' },
  { value: 'pond', label: 'Comparar viveiros' },
  { value: 'metric', label: 'Outra métrica (correlação)' },
];

const X_AXIS_LABELS: Record<DashboardXAxis, string> = {
  date: 'por data',
  week: 'por semana de cultivo',
  pond: 'comparativo entre viveiros',
  metric: 'correlação',
};

function formatXLabel(raw: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(5).split('-').reverse().join('/');
  if (/^S\d+$/.test(raw)) return `S${Number(raw.slice(1))}`;
  return raw;
}

function panelId() {
  return `panel-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * One saved chart: resolves its series and renders the picked chart type.
 * Reused as-is on the Painel operacional (home) to preview the most
 * recently updated saved dashboard — `onRemove` omitted there, since
 * deleting a panel from the home page would be a surprising side effect.
 */
export function PanelCard({
  panel,
  metrics,
  onRemove,
}: {
  panel: DashboardPanel;
  metrics: DashboardMetric[];
  onRemove?: () => void;
}) {
  const isMetricAxis = (panel.xAxis ?? 'date') === 'metric';
  const series = useMetricSeries(isMetricAxis ? null : panel);
  const scatter = useMetricScatter(isMetricAxis ? panel : null);
  const metric = metrics.find((item) => item.key === panel.metric);
  const xMetric = metrics.find((item) => item.key === panel.xMetric);

  const isPondAxis = (panel.xAxis ?? 'date') === 'pond';

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const pondSeries of series.data ?? []) {
      for (const point of pondSeries.points) {
        const row = byDate.get(point.date) ?? { date: formatXLabel(point.date) };
        row[pondSeries.pondCode] = point.value;
        byDate.set(point.date, row);
      }
    }
    const rows = Array.from(byDate.entries());
    // Pond comparison keeps the backend's code order; the others sort by key.
    if (!isPondAxis) rows.sort(([a], [b]) => a.localeCompare(b));
    return rows.map(([, row]) => row);
  }, [series.data, isPondAxis]);

  const isLoading = isMetricAxis ? scatter.isLoading : series.isLoading;
  const hasData = isMetricAxis ? (scatter.data ?? []).some((item) => item.points.length) : chartData.length > 0;
  const pondCodes = isMetricAxis ? (scatter.data ?? []).map((item) => item.pondCode) : (series.data ?? []).map((item) => item.pondCode);
  // Com dezenas de viveiros a legenda deixa de informar e vira ruído.
  const showLegend = pondCodes.length > 1 && pondCodes.length <= 10;

  const tooltipStyle = {
    borderRadius: radius.tile,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    boxShadow: shadow.raised,
  };
  const axisTick = { fill: 'var(--text-muted)', fontSize: 11 };

  function renderChart() {
    if (panel.chartType === 'bar') {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
          <XAxis dataKey="date" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {pondCodes.map((code, index) => (
            <Bar key={code} dataKey={code} fill={SERIES_COLORS[index % SERIES_COLORS.length]} radius={[6, 6, 2, 2]} />
          ))}
        </BarChart>
      );
    }
    if (panel.chartType === 'area') {
      return (
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
          <XAxis dataKey="date" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {pondCodes.map((code, index) => (
            <Area
              key={code}
              dataKey={code}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    }
    return (
      <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
        <XAxis dataKey="date" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={tooltipStyle} />
        {showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {pondCodes.map((code, index) => (
          <Line
            key={code}
            dataKey={code}
            stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    );
  }

  /** Correlation mode: one point per day both metrics have a reading, one series per pond. */
  function renderScatterChart() {
    return (
      <ScatterChart margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
        <XAxis
          type="number"
          dataKey="x"
          name={xMetric?.label ?? panel.xMetric}
          tick={axisTick}
          label={{ value: xMetric?.label ?? panel.xMetric, position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--text-muted)' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={metric?.label ?? panel.metric}
          tick={axisTick}
          label={{ value: metric?.label ?? panel.metric, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
        {showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {(scatter.data ?? []).map((pondSeries, index) => (
          <Scatter
            key={pondSeries.pondCode}
            name={pondSeries.pondCode}
            data={pondSeries.points}
            fill={SERIES_COLORS[index % SERIES_COLORS.length]}
          />
        ))}
      </ScatterChart>
    );
  }

  return (
    <div style={workspaceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.inline, alignItems: 'baseline' }}>
        <div>
          <h3 style={sectionTitle}>{panel.title}</h3>
          <div style={{ ...sectionSubtitle, marginTop: 2 }}>
            {isMetricAxis
              ? `${metric?.label ?? panel.metric} × ${xMetric?.label ?? panel.xMetric}`
              : metric?.label ?? panel.metric}
            {` · ${X_AXIS_LABELS[panel.xAxis ?? 'date']}`}
            {panel.from || panel.to ? ` · ${panel.from || '…'} → ${panel.to || 'hoje'}` : ' · todo o período'}
          </div>
        </div>
        {onRemove && (
          <Button variant="secondary" icon={<X size={14} />} onClick={onRemove} style={{ padding: '6px 10px' }}>
            Remover
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando…</div>
      ) : !hasData ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {isMetricAxis
            ? 'Sem dias em que as duas métricas tenham leitura no mesmo período.'
            : 'Sem dados para esta combinação de métrica, viveiros e período.'}
        </div>
      ) : (
        <div style={{ height: 280 }}>
          <ResponsiveContainer>{isMetricAxis ? renderScatterChart() : renderChart()}</ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function CustomDashboardsPage() {
  const { data: metrics = [] } = useDashboardMetrics();
  const { data: ponds = [] } = usePonds();
  const dashboards = useDashboards();
  const saveDashboard = useSaveDashboard();
  const deleteDashboard = useDeleteDashboard();

  const [activeDashboardId, setActiveDashboardId] = useState('');
  const [name, setName] = useState('Meu painel');
  const [panels, setPanels] = useState<DashboardPanel[]>([]);
  const [dirty, setDirty] = useState(false);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    metric: '',
    xMetric: '',
    chartType: 'line' as DashboardChartType,
    xAxis: 'date' as DashboardXAxis,
    pondIds: [] as string[],
    from: '',
    to: '',
  });

  const activeDashboard = dashboards.data?.find((item) => item.id === activeDashboardId) ?? null;

  // Load the picked dashboard into the editor, unless there are unsaved edits.
  useEffect(() => {
    if (!activeDashboard) return;
    setName(activeDashboard.name);
    setPanels(activeDashboard.panels ?? []);
    setDirty(false);
  }, [activeDashboard]);

  const metricOptions = useMemo(() => {
    const groups = new Map<string, DashboardMetric[]>();
    for (const metric of metrics) {
      groups.set(metric.group, [...(groups.get(metric.group) ?? []), metric]);
    }
    return Array.from(groups.entries());
  }, [metrics]);

  const dashboardOptions = [
    { value: '', label: 'Novo painel (não salvo)' },
    ...(dashboards.data ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];

  function togglePond(id: string) {
    setDraft((current) => ({
      ...current,
      pondIds: current.pondIds.includes(id)
        ? current.pondIds.filter((pondId) => pondId !== id)
        : [...current.pondIds, id],
    }));
  }

  function addPanel() {
    if (!draft.metric) return;
    if (draft.xAxis === 'metric' && !draft.xMetric) return;
    const metric = metrics.find((item) => item.key === draft.metric);
    setPanels((current) => [
      ...current,
      {
        id: panelId(),
        title: draft.title.trim() || metric?.label || draft.metric,
        // Uma barra por viveiro é o desenho natural do comparativo; correlação usa dispersão.
        chartType: draft.xAxis === 'pond' ? 'bar' : draft.chartType,
        metric: draft.metric,
        xAxis: draft.xAxis,
        ...(draft.xAxis === 'metric' ? { xMetric: draft.xMetric } : {}),
        pondIds: draft.pondIds,
        from: draft.from || null,
        to: draft.to || null,
      },
    ]);
    setDirty(true);
    setDraft({ title: '', metric: '', xMetric: '', chartType: 'line', xAxis: 'date', pondIds: [], from: '', to: '' });
    setBuilderOpen(false);
  }

  function removePanel(id: string) {
    setPanels((current) => current.filter((panel) => panel.id !== id));
    setDirty(true);
  }

  async function handleSave() {
    if (!name.trim() || !panels.length) return;
    const saved = await saveDashboard.mutateAsync({
      id: activeDashboardId || undefined,
      name: name.trim(),
      panels,
    });
    setActiveDashboardId(saved.id);
    setDirty(false);
  }

  async function handleDelete() {
    if (!activeDashboardId) return;
    await deleteDashboard.mutateAsync(activeDashboardId);
    setActiveDashboardId('');
    setName('Meu painel');
    setPanels([]);
    setDirty(false);
  }

  function startNew() {
    setActiveDashboardId('');
    setName('Meu painel');
    setPanels([]);
    setDirty(false);
  }

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.section, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={workspaceEyebrow}>Painéis customizáveis</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 520 }}>
              Monte quantos gráficos quiser cruzando produção, nutrição, sanidade, qualidade da água e financeiro.
              Salve o painel para reabrir depois.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) minmax(160px, 220px) auto auto auto', gap: space.inline, alignItems: 'end' }}>
            <Select
              label="Painel salvo"
              options={dashboardOptions}
              value={activeDashboardId}
              onChange={(e) => setActiveDashboardId(e.target.value)}
            />
            <Input label="Nome do painel" value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
            <Button variant="secondary" icon={<LayoutGrid size={16} />} onClick={startNew} style={{ whiteSpace: 'nowrap' }}>
              Novo
            </Button>
            <Button
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={saveDashboard.isPending}
              disabled={!name.trim() || !panels.length || (!dirty && Boolean(activeDashboardId))}
              style={{ whiteSpace: 'nowrap' }}
            >
              Salvar
            </Button>
            {activeDashboardId ? (
              <Button
                variant="secondary"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                loading={deleteDashboard.isPending}
                style={{ whiteSpace: 'nowrap' }}
              >
                Excluir
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {panels.length === 0 ? (
        <section style={{ ...workspaceCard, alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={sectionTitle}>Nenhum gráfico neste painel ainda</h2>
          <div style={{ ...sectionSubtitle, marginTop: 4 }}>
            Combine qualquer métrica com os viveiros e o período que quiser — sem limite de gráficos.
          </div>
          <div style={{ marginTop: 16 }}>
            <Button icon={<Plus size={16} />} onClick={() => setBuilderOpen(true)}>Adicionar gráfico</Button>
          </div>
        </section>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: space.page }}>
            {panels.map((panel) => (
              <PanelCard key={panel.id} panel={panel} metrics={metrics} onRemove={() => removePanel(panel.id)} />
            ))}
          </div>
          <div>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setBuilderOpen(true)}>
              Adicionar gráfico
            </Button>
          </div>
        </>
      )}

      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)} title="Novo gráfico" width={640}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Título (opcional)"
              value={draft.title}
              onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
              placeholder="Ex.: FCA das engordas no trimestre"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Métrica (eixo Y)
            </label>
            <select
              value={draft.metric}
              onChange={(e) => setDraft((current) => ({ ...current, metric: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            >
              <option value="">Selecione…</option>
              {metricOptions.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((metric) => (
                    <option key={metric.key} value={metric.key}>{metric.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <Select
            label="Eixo X"
            options={X_AXIS_OPTIONS}
            value={draft.xAxis}
            onChange={(e) => setDraft((current) => ({ ...current, xAxis: e.target.value as DashboardXAxis }))}
          />

          {draft.xAxis === 'metric' ? (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Eixo X (métrica)
              </label>
              <select
                value={draft.xMetric}
                onChange={(e) => setDraft((current) => ({ ...current, xMetric: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              >
                <option value="">Selecione…</option>
                {metricOptions.map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items
                      .filter((metric) => metric.key !== draft.metric)
                      .map((metric) => (
                        <option key={metric.key} value={metric.key}>{metric.label}</option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : draft.xAxis !== 'pond' ? (
            <Select
              label="Tipo de gráfico"
              options={CHART_TYPE_OPTIONS}
              value={draft.chartType}
              onChange={(e) => setDraft((current) => ({ ...current, chartType: e.target.value as DashboardChartType }))}
            />
          ) : (
            <div style={{ alignSelf: 'end', color: 'var(--text-muted)', fontSize: 12, paddingBottom: 10 }}>
              Comparativo entre viveiros usa barras — uma por tanque.
            </div>
          )}

          {draft.xAxis === 'metric' ? (
            <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: 12, marginTop: -6 }}>
              Correlação usa dispersão (scatter): um ponto por dia em que as duas métricas têm leitura, uma cor por viveiro.
            </div>
          ) : null}

          <Input
            label="De (opcional)"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft((current) => ({ ...current, from: e.target.value }))}
          />
          <Input
            label="Até (opcional)"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft((current) => ({ ...current, to: e.target.value }))}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Viveiros ({draft.pondIds.length === 0 ? 'todos' : `${draft.pondIds.length} selecionados`})
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto', padding: '4px 0' }}>
              {ponds.map((pond) => {
                const selected = draft.pondIds.includes(pond.id);
                return (
                  <button
                    key={pond.id}
                    type="button"
                    onClick={() => togglePond(pond.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selected ? '1px solid var(--accent-dark)' : '1px solid var(--border)',
                      background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
                      color: selected ? 'var(--accent-dark)' : 'var(--text-secondary)',
                    }}
                  >
                    {pond.code}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <Button variant="secondary" onClick={() => setBuilderOpen(false)}>Cancelar</Button>
            <Button onClick={addPanel} disabled={!draft.metric || (draft.xAxis === 'metric' && !draft.xMetric)}>Adicionar ao painel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
