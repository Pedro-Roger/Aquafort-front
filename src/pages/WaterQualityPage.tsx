import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Wifi, WifiOff, Wind, Thermometer, Droplets, FlaskConical, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useCycles } from '../hooks/useCycles';
import { useWaterQuality, useCreateWaterQuality, useWaterQualitySocket, useWaterQualitySeries } from '../hooks/useWaterQuality';
import type { WaterQualitySeries } from '../hooks/useWaterQuality';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import type { WaterQuality } from '../types';
import { CyclePhase } from '../types';

const measurementSchema = z.object({
  oxygenMgL: z.coerce.number().min(0).max(20),
  ph: z.coerce.number().min(0).max(14),
  salinityPpt: z.coerce.number().min(0).max(50),
  temperatureC: z.coerce.number().min(0).max(45),
  ammoniaMgL: z.coerce.number().min(0),
  responsibleId: z.string().optional(),
});

type MeasurementForm = z.infer<typeof measurementSchema>;
type MeasurementFormInput = z.input<typeof measurementSchema>;

type ParamTab = 'oxygenMgL' | 'ph' | 'salinityPpt' | 'temperatureC' | 'ammoniaMgL';

const paramConfig: Record<ParamTab, { label: string; unit: string; color: string; icon: React.ReactNode; min: number; max: number }> = {
  oxygenMgL:   { label: 'Oxigênio', unit: 'mg/L', color: '#38bdf8', icon: <Wind size={16} />, min: 4, max: 10 },
  ph:           { label: 'pH', unit: '', color: '#0ea5e9', icon: <Activity size={16} />, min: 6.5, max: 8.5 },
  salinityPpt:  { label: 'Salinidade', unit: 'ppt', color: '#7dd3fc', icon: <Droplets size={16} />, min: 0, max: 40 },
  temperatureC: { label: 'Temperatura', unit: '°C', color: '#1d4ed8', icon: <Thermometer size={16} />, min: 20, max: 32 },
  ammoniaMgL:   { label: 'Amônia', unit: 'mg/L', color: '#0284c7', icon: <FlaskConical size={16} />, min: 0, max: 0.5 },
};

function isOutOfRange(param: ParamTab, value: number): boolean {
  const { min, max } = paramConfig[param];
  return value < min || value > max;
}

function fmtDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yy HH:mm', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function WaterQualityPage() {
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [activeParam, setActiveParam] = useState<ParamTab>('oxygenMgL');
  const socketConnected = !!selectedCycleId;

  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const activeCycles = cycles.filter((c) => c.phase !== CyclePhase.ENCERRADO);

  const { data: measurements = [], isLoading } = useWaterQuality(selectedCycleId || undefined);
  useWaterQualitySocket(selectedCycleId || undefined);
  const { data: series, isLoading: seriesLoading } = useWaterQualitySeries(selectedCycleId || null);

  const [seriesParam, setSeriesParam] = useState<keyof WaterQualitySeries>('doMgL');
  const quickLinks = [
    { to: '/dashboard', label: 'Voltar ao painel' },
    { to: '/nutrition', label: 'Ração' },
    { to: '/biometrias', label: 'Biometrias' },
    { to: '/povoamento', label: 'Povoamento' },
  ];

  // socketConnected mirrors whether a cycle is selected

  const createMeasurement = useCreateWaterQuality();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeasurementFormInput, unknown, MeasurementForm>({
    resolver: zodResolver(measurementSchema),
    defaultValues: { oxygenMgL: 6.5, ph: 7.5, salinityPpt: 15, temperatureC: 28, ammoniaMgL: 0.1 },
  });

  const cycleOptions = activeCycles.map((c) => ({
    value: c.id,
    label: `${c.lotCode} — ${c.pond?.code ?? c.pondId}`,
  }));

  // Last measurement per parameter
  const lastMeasurement = measurements[0];

  // Chart data (last 30 readings, oldest first)
  const chartData = [...measurements]
    .slice(0, 30)
    .reverse()
    .map((m) => ({
      time: fmtDate(m.measuredAt),
      value: m[activeParam],
    }));

  async function onSubmit(values: MeasurementForm) {
    if (!selectedCycleId) return;
    await createMeasurement.mutateAsync({ ...values, cycleId: selectedCycleId });
    setNewModal(false);
    reset();
  }

  const tableColumns = [
    {
      key: 'measuredAt',
      header: 'Data/Hora',
      render: (m: WaterQuality) => <span>{fmtDate(m.measuredAt)}</span>,
    },
    {
      key: 'oxygenMgL',
      header: 'O₂ (mg/L)',
      align: 'right' as const,
      render: (m: WaterQuality) => (
        <CellValue value={m.oxygenMgL} param="oxygenMgL" />
      ),
    },
    {
      key: 'ph',
      header: 'pH',
      align: 'right' as const,
      render: (m: WaterQuality) => <CellValue value={m.ph} param="ph" />,
    },
    {
      key: 'salinityPpt',
      header: 'Salinidade (ppt)',
      align: 'right' as const,
      render: (m: WaterQuality) => <CellValue value={m.salinityPpt} param="salinityPpt" />,
    },
    {
      key: 'temperatureC',
      header: 'Temp. (°C)',
      align: 'right' as const,
      render: (m: WaterQuality) => <CellValue value={m.temperatureC} param="temperatureC" />,
    },
    {
      key: 'ammoniaMgL',
      header: 'Amônia (mg/L)',
      align: 'right' as const,
      render: (m: WaterQuality) => <CellValue value={m.ammoniaMgL} param="ammoniaMgL" />,
    },
    {
      key: 'responsibleName',
      header: 'Responsável',
      render: (m: WaterQuality) => <span>{m.responsibleName ?? '—'}</span>,
    },
    {
      key: 'outOfRange',
      header: 'Alertas',
      render: (m: WaterQuality) =>
        m.outOfRange ? (
          <span style={{ color: '#1d4ed8', fontSize: '12px', fontWeight: 600 }}>
            ⚠ {m.outOfRangeParams?.join(', ')}
          </span>
        ) : (
          <span style={{ color: '#0ea5e9', fontSize: '12px' }}>✓ OK</span>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Qualidade da Água</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Leitura do ciclo e alerta operacional.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Socket indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: socketConnected ? 'var(--accent)' : 'var(--text-muted)' }}>
            {socketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {socketConnected ? 'Ao vivo' : 'Offline'}
          </div>
          {/* Cycle selector */}
          <select
            value={selectedCycleId}
            onChange={(e) => {
              setSelectedCycleId(e.target.value);
            }}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="">Selecione um lote...</option>
            {cycleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            disabled={!selectedCycleId}
            onClick={() => setNewModal(true)}
          >
            Nova Medição
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {selectedCycleId ? (
        <>
          {/* Real-time parameter cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {(Object.keys(paramConfig) as ParamTab[]).map((param) => {
              const cfg = paramConfig[param];
              const val = lastMeasurement?.[param];
              const oor = val !== undefined ? isOutOfRange(param, val) : false;
              return (
                <div
                  key={param}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: `1px solid ${oor ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    borderLeft: `3px solid ${oor ? '#1d4ed8' : cfg.color}`,
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: cfg.color }}>
                    {cfg.icon}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: oor ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {val?.toFixed(2) ?? '—'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cfg.unit}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {oor ? '⚠ Fora do range' : `${cfg.min}–${cfg.max} ${cfg.unit}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* Param tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {(Object.keys(paramConfig) as ParamTab[]).map((param) => {
                const cfg = paramConfig[param];
                const isActive = activeParam === param;
                return (
                  <button
                    key={param}
                    onClick={() => setActiveParam(param)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '6px',
                      border: '1px solid transparent',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                      color: isActive ? cfg.color : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: paramConfig[activeParam].color }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={paramConfig[activeParam].color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={`${paramConfig[activeParam].label} (${paramConfig[activeParam].unit})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Série Temporal */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Série Temporal</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>histórico completo por parâmetro</span>
            </div>
            {seriesLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando série...</div>
            ) : series ? (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {([
                    { key: 'doMgL', label: 'O₂ (mg/L)', color: '#0ea5e9' },
                    { key: 'ph', label: 'pH', color: '#38bdf8' },
                    { key: 'salinity', label: 'Salinidade (‰)', color: '#7dd3fc' },
                    { key: 'temperatureC', label: 'Temp (°C)', color: '#1d4ed8' },
                    { key: 'ammoniaMgL', label: 'Amônia (mg/L)', color: '#0284c7' },
                  ] as const).map(p => (
                    <button
                      key={p.key}
                      onClick={() => setSeriesParam(p.key)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                        backgroundColor: seriesParam === p.key ? p.color : 'transparent',
                        border: `1px solid ${seriesParam === p.key ? p.color : 'var(--border)'}`,
                        color: seriesParam === p.key ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {series[seriesParam].length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                    Sem medições para exibir.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={series[seriesParam].map(p => ({
                        date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        value: p.value,
                      }))}
                      margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} domain={['auto', 'auto']} width={40} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        labelStyle={{ color: 'var(--text-secondary)' }}
                        itemStyle={{ color: '#0ea5e9' }}
                      />
                      <Line
                        type="monotone" dataKey="value"
                        stroke="#0ea5e9" strokeWidth={2}
                        dot={{ fill: '#0ea5e9', r: 3 }} activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            ) : null}
          </div>

          {/* History table */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Histórico de Medições
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                {measurements.length} registros
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Table
                columns={tableColumns}
                data={measurements}
                rowKey={(m) => m.id}
                loading={isLoading}
                emptyMessage="Nenhuma medição registrada"
              />
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--text-muted)',
          }}
        >
          <Droplets size={48} style={{ opacity: 0.4 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>Selecione um lote</p>
            <p style={{ fontSize: '13px' }}>Escolha um lote ativo para visualizar os dados de qualidade da água</p>
          </div>
        </div>
      )}

      {/* New measurement modal */}
      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); reset(); }}
        title="Nova Medição"
        width={480}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input
              label="Oxigênio (mg/L)"
              type="number"
              step="0.01"
              error={errors.oxygenMgL?.message}
              {...register('oxygenMgL')}
            />
            <Input
              label="pH"
              type="number"
              step="0.01"
              error={errors.ph?.message}
              {...register('ph')}
            />
            <Input
              label="Salinidade (ppt)"
              type="number"
              step="0.1"
              error={errors.salinityPpt?.message}
              {...register('salinityPpt')}
            />
            <Input
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              error={errors.temperatureC?.message}
              {...register('temperatureC')}
            />
            <Input
              label="Amônia (mg/L)"
              type="number"
              step="0.001"
              error={errors.ammoniaMgL?.message}
              {...register('ammoniaMgL')}
            />
            <Select
              label="Responsável"
              options={[{ value: 'op1', label: 'Operador 1' }, { value: 'op2', label: 'Operador 2' }]}
              placeholder="Selecione..."
              {...register('responsibleId')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <Button variant="secondary" type="button" onClick={() => { setNewModal(false); reset(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CellValue({ value, param }: { value: number; param: ParamTab }) {
  const oor = isOutOfRange(param, value);
  return (
    <span style={{ color: oor ? 'var(--danger)' : 'var(--text-primary)', fontWeight: oor ? 600 : 400 }}>
      {value?.toFixed(2)}
    </span>
  );
}
