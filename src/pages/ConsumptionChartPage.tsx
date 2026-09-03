import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { useConsumptionSeries } from '../hooks/useConsumptionSeries';
import { usePonds } from '../hooks/usePonds';
import { accumulatedKey, buildChartRows, colorFor, dailyKey, summarise, weightKey } from './consumptionChart';

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function shortDate(value: string) {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

export function ConsumptionChartPage() {
  const [onlyActive, setOnlyActive] = useState(true);
  const { data: allPonds = [] } = usePonds();
  const ponds = onlyActive ? allPonds.filter((p) => p.status === 'POVOADO') : allPonds;
  const [selected, setSelected] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [chartMode, setChartMode] = useState<'accumulated' | 'daily'>('daily');

  // Start with the ponds that are stocked — the ones being fed right now.
  useEffect(() => {
    if (selected.length || !ponds.length) return;
    const stocked = ponds.filter((pond) => pond.status === 'POVOADO');
    setSelected((stocked.length ? stocked : ponds).slice(0, 3).map((pond) => pond.id));
  }, [ponds, selected.length]);

  const { data: series = [], isLoading } = useConsumptionSeries({
    pondIds: selected,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = useMemo(() => buildChartRows(series, allPonds), [series, allPonds]);
  const summary = useMemo(() => summarise(series), [series]);

  function toggle(pondId: string) {
    setSelected((current) =>
      current.includes(pondId) ? current.filter((id) => id !== pondId) : [...current, pondId],
    );
  }

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Consumo e crescimento</div>
            <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 640 }}>
              Ração acumulada e gramatura no mesmo eixo de tempo. Selecione os viveiros para comparar.
            </p>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10 }}>
              <input
                type="checkbox"
                id="onlyActive"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
              />
              <label htmlFor="onlyActive" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                Em ciclo
              </label>
            </div>
            <div style={{ minWidth: 150 }}>
              <Input label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div style={{ minWidth: 150 }}>
              <Input label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, marginLeft: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Exibir:</span>
              <select
                value={chartMode}
                onChange={(e) => setChartMode(e.target.value as 'accumulated' | 'daily')}
                style={{
                  padding: '4px 8px',
                  borderRadius: radius.tile,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="daily">Ração por ha/dia</option>
                <option value="accumulated">Ração Acumulada</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline, marginTop: space.section }}>
          {ponds.map((pond) => {
            const active = selected.includes(pond.id);
            const index = selected.indexOf(pond.id);
            return (
              <button
                key={pond.id}
                onClick={() => toggle(pond.id)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: radius.pill,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1px solid ${active ? colorFor(index) : 'var(--border)'}`,
                  backgroundColor: active ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: active ? colorFor(index) : 'var(--border-strong)',
                  }}
                />
                {pond.code}
              </button>
            );
          })}
        </div>
      </div>

      {summary.length > 0 && (
        <div style={metricGrid}>
          {summary.map((pond, index) => (
            <div key={pond.pondId} style={{ ...workspaceTile, borderLeft: `3px solid ${colorFor(index)}` }}>
              <div style={workspaceTileLabel}>{pond.pondCode}</div>
              <div style={workspaceTileValue}>{fmt(pond.accumulatedKg, 1)} kg</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                ração acumulada · peso {fmt(pond.averageWeightG, 2)} g
              </div>
            </div>
          ))}
        </div>
      )}

      <section style={workspaceCard}>
        <div>
          <h2 style={sectionTitle}>{chartMode === 'daily' ? 'Ração diária (kg/ha) x gramatura' : 'Ração acumulada x gramatura'}</h2>
          <p style={{ ...sectionSubtitle, marginTop: 4 }}>
            {chartMode === 'daily' 
              ? 'A linha cheia é o consumo diário por hectare (kg/ha, eixo da esquerda). Os pontos são o peso médio (g, eixo da direita).'
              : 'A linha cheia é a ração acumulada (kg, eixo da esquerda). Os pontos são o peso médio medido (g, eixo da direita).'}
          </p>
        </div>

        {!selected.length ? (
          <EmptyState title="Selecione ao menos um viveiro para ver a curva." />
        ) : !rows.length && !isLoading ? (
          <EmptyState title="Nenhum trato registrado no período escolhido." />
        ) : (
          <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer>
              <ComposedChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} minTickGap={24} />
                <YAxis yAxisId="kg" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}${chartMode === 'daily' ? 'kg/ha' : 'kg'}`} />
                <YAxis yAxisId="g" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `${value}g`} />
                <Tooltip
                  labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')}
                  formatter={(value: unknown, name: unknown) => {
                    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                    const label = String(name);
                    if (label.endsWith('peso')) return [`${fmt(numeric, 2)} g`, label];
                    if (label.endsWith('diário')) return [`${fmt(numeric, 1)} kg/ha/dia`, label];
                    return [`${fmt(numeric, 1)} kg`, label];
                  }}
                  contentStyle={{
                    borderRadius: radius.tile,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.map((pond, index) => (
                  <Line
                    key={`${pond.pondId}-kg`}
                    yAxisId="kg"
                    type="monotone"
                    dataKey={chartMode === 'daily' ? dailyKey(pond.pondCode) : accumulatedKey(pond.pondCode)}
                    stroke={colorFor(index)}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                {series.map((pond, index) => (
                  <Line
                    key={`${pond.pondId}-g`}
                    yAxisId="g"
                    type="monotone"
                    dataKey={weightKey(pond.pondCode)}
                    stroke={colorFor(index)}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
