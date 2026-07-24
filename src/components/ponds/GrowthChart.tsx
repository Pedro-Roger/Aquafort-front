import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { useGrowthChart } from '../../hooks/useCycles';

interface Props {
  cycleId: string;
  targetWeightG: number | null;
}

export function GrowthChart({ cycleId, targetWeightG }: Props) {
  const { data, isLoading } = useGrowthChart(cycleId);

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando gráfico...</div>;
  if (!data) return null;

  if (!data.expectedCurve.length && !data.realCurve.length) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
        Defina a meta de crescimento para ver o gráfico.
      </div>
    );
  }

  const allDays = new Set([
    ...data.expectedCurve.map(p => p.day),
    ...data.realCurve.map(p => p.day),
  ]);

  const chartData = Array.from(allDays).sort((a, b) => a - b).map(day => {
    const exp = data.expectedCurve.find(p => p.day === day);
    const real = data.realCurve.find(p => p.day === day);
    return {
      day,
      esperado: exp ? Number(exp.weight.toFixed(2)) : undefined,
      real: real ? Number(real.weight.toFixed(2)) : undefined,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const realPt = payload.find((p: any) => p.dataKey === 'real');
    const espPt = payload.find((p: any) => p.dataKey === 'esperado');
    const diff = realPt && espPt ? (realPt.value - espPt.value).toFixed(1) : null;
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Dia {label}</div>
        {realPt && <div style={{ color: '#0ea5e9' }}>Real: {realPt.value}g</div>}
        {espPt && <div style={{ color: 'var(--text-muted)' }}>Meta: {espPt.value}g</div>}
        {diff !== null && (
          <div style={{ color: Number(diff) >= 0 ? '#0284c7' : '#1d4ed8', marginTop: 4 }}>
            {Number(diff) >= 0 ? '+' : ''}{diff}g vs meta
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => `D${d}`} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}g`} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(val) => val === 'esperado' ? 'Meta' : 'Real'} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
          <Line type="monotone" dataKey="esperado" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="real" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3 }} activeDot={{ r: 5 }} connectNulls />
          {data.projectedHarvestDay && (
            <ReferenceLine x={data.projectedHarvestDay} stroke="#38bdf8" strokeDasharray="3 3"
              label={{ value: 'Proj.', fill: '#38bdf8', fontSize: 10, position: 'top' }} />
          )}
          {targetWeightG && (
            <ReferenceLine y={targetWeightG} stroke="#0ea5e9" strokeDasharray="3 3"
              label={{ value: `${targetWeightG}g`, fill: '#0ea5e9', fontSize: 10, position: 'right' }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
