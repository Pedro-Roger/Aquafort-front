import { useMemo, useState } from 'react';
import { HeartPulse, Plus, Skull, TrendingDown, Users2 } from 'lucide-react';
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
import { useCreateMortality, useMortalitySeries, useMortalityTable } from '../hooks/useMortality';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
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
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import type { MortalityTableRow } from '../types';

function currentLocalDateTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function fmtInt(value: number) {
  return value.toLocaleString('pt-BR');
}

function fmt(value: number, digits = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const CAUSE_OPTIONS = [
  { value: '', label: 'Sem causa definida' },
  { value: 'doenca', label: 'Doença' },
  { value: 'oxigenio', label: 'Baixo oxigênio' },
  { value: 'temperatura', label: 'Temperatura' },
  { value: 'manejo', label: 'Manejo' },
  { value: 'predacao', label: 'Predação' },
  { value: 'outros', label: 'Outros' },
];

export function MortalidadePage() {
  const { user } = useAuth();
  const table = useMortalityTable();
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const createMortality = useCreateMortality();

  const [search, setSearch] = useState('');
  const [onlyWithDeaths, setOnlyWithDeaths] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({
    cycleId: '',
    quantity: '',
    recordedAt: currentLocalDateTime(),
    cause: '',
    observation: '',
  });

  const rows = useMemo(() => {
    const all = table.data?.rows ?? [];
    const term = search.trim().toLowerCase();
    return all
      .filter((row) => !term || row.pondCode.toLowerCase().includes(term) || row.lotCode.toLowerCase().includes(term))
      .filter((row) => !onlyWithDeaths || row.totalMortality > 0);
  }, [table.data?.rows, search, onlyWithDeaths]);

  const chartCycleId = selectedCycleId || rows.find((row) => row.totalMortality > 0)?.cycleId || rows[0]?.cycleId || null;
  const chartRow = rows.find((row) => row.cycleId === chartCycleId) ?? null;
  const series = useMortalitySeries(chartCycleId);

  const chartData = (series.data?.points ?? []).map((point) => ({
    data: point.date.slice(5).split('-').reverse().join('/'),
    mortos: point.quantity,
    acumulado: point.accumulated,
    sobrevivencia: point.survivalPct,
  }));

  const totals = table.data?.totals;
  const metrics = [
    { label: 'Mortalidade total', value: totals ? `${fmtInt(totals.totalMortality)} un` : '—', icon: <Skull size={18} /> },
    { label: 'População atual', value: totals ? `${fmtInt(totals.currentPopulation)} un` : '—', icon: <Users2 size={18} /> },
    { label: 'Sobrevivência est.', value: totals?.survivalEstPct != null ? `${fmt(totals.survivalEstPct)}%` : '—', icon: <HeartPulse size={18} /> },
    { label: 'Viveiros monitorados', value: `${table.data?.rows.length ?? 0}`, icon: <TrendingDown size={18} /> },
  ];

  const formCycleId = form.cycleId || cycles[0]?.id || '';
  const formCycle = cycles.find((cycle) => cycle.id === formCycleId) ?? null;

  async function handleRegister() {
    if (!user?.id || !formCycle || !form.quantity || !form.recordedAt) return;

    await createMortality.mutateAsync({
      cycleId: formCycle.id,
      pondId: formCycle.pondId,
      quantity: Number(form.quantity),
      recordedAt: new Date(form.recordedAt).toISOString(),
      cause: form.cause || undefined,
      observation: form.observation || undefined,
      responsibleId: user.id,
    });

    setForm({ cycleId: '', quantity: '', recordedAt: currentLocalDateTime(), cause: '', observation: '' });
    setRegisterOpen(false);
  }

  const cycleOptions = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.pond?.code ?? cycle.pondId} · ${cycle.pond?.name ?? 'Viveiro'}`,
  }));

  const chartOptions = rows.map((row) => ({ value: row.cycleId, label: `${row.pondCode} · ${row.lotCode}` }));

  const columns = [
    {
      key: 'pond',
      header: 'Tanque',
      render: (row: MortalityTableRow) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.pondCode}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.lotCode}</div>
        </div>
      ),
    },
    {
      key: 'lastRecordAt',
      header: 'Últ. cadastro',
      render: (row: MortalityTableRow) =>
        row.lastRecordAt ? new Date(row.lastRecordAt).toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'lastQuantity',
      header: 'Últ. mortalidade',
      align: 'right' as const,
      render: (row: MortalityTableRow) => `${fmtInt(row.lastQuantity)} un`,
    },
    {
      key: 'lastResponsibleName',
      header: 'Responsável',
      render: (row: MortalityTableRow) => <span>{row.lastResponsibleName ?? '—'}</span>,
    },
    {
      key: 'totalMortality',
      header: 'Mortalidade total',
      align: 'right' as const,
      render: (row: MortalityTableRow) => (
        <span style={{ color: row.totalMortality > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: row.totalMortality > 0 ? 700 : 400 }}>
          {fmtInt(row.totalMortality)} un
        </span>
      ),
    },
    {
      key: 'survivalEstPct',
      header: 'Sobrev. est.',
      align: 'right' as const,
      render: (row: MortalityTableRow) => (row.survivalEstPct == null ? '—' : `${fmt(row.survivalEstPct)}%`),
    },
    {
      key: 'initialPopulation',
      header: 'Pop. inicial',
      align: 'right' as const,
      render: (row: MortalityTableRow) => `${fmtInt(row.initialPopulation)} un`,
    },
    {
      key: 'currentPopulation',
      header: 'Pop. atual',
      align: 'right' as const,
      render: (row: MortalityTableRow) => `${fmtInt(row.currentPopulation)} un`,
    },
    {
      key: 'biomassKg',
      header: 'Biomassa',
      align: 'right' as const,
      render: (row: MortalityTableRow) => (row.biomassKg == null ? '—' : `${fmt(row.biomassKg)} kg`),
    },
  ];

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.section, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={workspaceEyebrow}>Mortalidade</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) auto auto', gap: space.inline, alignItems: 'end' }}>
            <Input label="Buscar tanque" placeholder="Ex.: VE231" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button
              variant={onlyWithDeaths ? 'primary' : 'secondary'}
              onClick={() => setOnlyWithDeaths((current) => !current)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Com mortalidade
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => setRegisterOpen(true)} style={{ whiteSpace: 'nowrap' }}>
              Cadastrar mortalidade
            </Button>
          </div>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={workspaceTile}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={workspaceTileLabel}>{metric.label}</span>
                <span style={{ color: 'var(--accent-dark)', display: 'inline-flex' }}>{metric.icon}</span>
              </div>
              <div style={workspaceTileValue}>{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.tile, flexWrap: 'wrap' }}>
          <h2 style={sectionTitle}>Mortalidade por viveiro</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {rows.length} viveiro{rows.length === 1 ? '' : 's'} com ciclo ativo
          </div>
        </div>
        <Table
          columns={columns}
          data={rows}
          rowKey={(row) => row.cycleId}
          loading={table.isLoading}
          emptyMessage="Nenhum ciclo ativo encontrado"
        />
      </section>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.inline, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <h2 style={sectionTitle}>Curva de mortalidade</h2>
            <div style={{ ...sectionSubtitle, marginTop: 2 }}>
              Barras para os mortos do dia, linha para o acumulado do ciclo.
            </div>
          </div>
          <div style={{ minWidth: 240 }}>
            <Select
              label="Tanque"
              options={chartOptions}
              value={chartCycleId ?? ''}
              onChange={(e) => setSelectedCycleId(e.target.value)}
            />
          </div>
        </div>

        {chartData.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {chartRow ? `Nenhuma mortalidade registrada em ${chartRow.pondCode}.` : 'Selecione um tanque para ver a curva.'}
          </div>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="data" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: radius.tile,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    boxShadow: shadow.raised,
                  }}
                />
                <Bar yAxisId="left" dataKey="mortos" fill="#ef4444" radius={[8, 8, 2, 2]} barSize={22} name="Mortos no dia" />
                <Line yAxisId="right" dataKey="acumulado" stroke="#b91c1c" strokeWidth={3} dot={{ r: 4 }} name="Acumulado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Cadastrar mortalidade" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Select
            label="Viveiro / ciclo"
            options={cycleOptions}
            value={formCycleId}
            onChange={(e) => setForm((current) => ({ ...current, cycleId: e.target.value }))}
          />
          <Input
            label="Quantidade (un)"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(e) => setForm((current) => ({ ...current, quantity: e.target.value }))}
          />
          <Input
            label="Data / hora"
            type="datetime-local"
            value={form.recordedAt}
            onChange={(e) => setForm((current) => ({ ...current, recordedAt: e.target.value }))}
          />
          <Select
            label="Causa provável"
            options={CAUSE_OPTIONS}
            value={form.cause}
            onChange={(e) => setForm((current) => ({ ...current, cause: e.target.value }))}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Observação"
              value={form.observation}
              onChange={(e) => setForm((current) => ({ ...current, observation: e.target.value }))}
              placeholder="Ex.: mortos na borda após chuva"
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Responsável: {user?.name ?? 'Sem usuário'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button
                loading={createMortality.isPending}
                onClick={handleRegister}
                disabled={!user?.id || !formCycleId || !form.quantity || Number(form.quantity) < 1}
              >
                Salvar registro
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
