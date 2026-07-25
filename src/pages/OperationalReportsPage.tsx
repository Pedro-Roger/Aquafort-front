import { useMemo, useState } from 'react';
import { Download, Filter, Package, Waves } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useCreateHarvestRecord, useExportOperationalReports, useOperationalReports } from '../hooks/useOperationalReports';
import type { OperationalReportPhase } from '../types';

const PHASES: Array<{ value: OperationalReportPhase | 'TODAS'; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'BERCARIOS', label: 'Berçários' },
  { value: 'VIVEIROS', label: 'Viveiros' },
  { value: 'REPRODUTORES', label: 'Reprodutores' },
];

export function OperationalReportsPage() {
  const [phase, setPhase] = useState<OperationalReportPhase | 'TODAS'>('TODAS');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pondId, setPondId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [harvestForm, setHarvestForm] = useState({
    cycleId: '',
    pondId: '',
    harvestedKg: '',
    harvestedAt: '',
    harvestType: 'TOTAL' as 'PARTIAL' | 'TOTAL',
    observation: '',
  });

  const query = useMemo(
    () => ({
      phase,
      from: from || undefined,
      to: to || undefined,
      pondId: pondId || undefined,
      cycleId: cycleId || undefined,
    }),
    [cycleId, from, pondId, phase, to],
  );

  const reports = useOperationalReports(query);
  const exportReport = useExportOperationalReports();
  const createHarvest = useCreateHarvestRecord();

  const rows = reports.data?.rows ?? [];
  const summary = {
    feedInKg: 0,
    feedOutKg: 0,
    partialHarvests: 0,
    totalHarvests: 0,
    stockInKg: 0,
    stockOutKg: 0,
    ...reports.data?.summary,
  };

  async function handleExport() {
    await exportReport.mutateAsync(query);
  }

  async function handleHarvestSubmit() {
    if (!harvestForm.cycleId || !harvestForm.pondId || !harvestForm.harvestedKg || !harvestForm.harvestedAt) return;
    await createHarvest.mutateAsync({
      cycleId: harvestForm.cycleId,
      pondId: harvestForm.pondId,
      harvestedKg: Number(harvestForm.harvestedKg),
      harvestedAt: harvestForm.harvestedAt,
      harvestType: harvestForm.harvestType,
      observation: harvestForm.observation || undefined,
      closesCycle: harvestForm.harvestType === 'TOTAL',
    });
    setHarvestForm({ cycleId: '', pondId: '', harvestedKg: '', harvestedAt: '', harvestType: 'TOTAL', observation: '' });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 24, padding: 20 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.72 }}>Relatórios</div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 30, lineHeight: 1.05 }}>Relatórios operacionais</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Exportação Excel por fase, com ração e despescas consolidadas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {[
          { label: 'Ração lançada', value: summary.feedInKg },
          { label: 'Despesca kg', value: summary.feedOutKg },
          { label: 'Parciais', value: summary.partialHarvests },
          { label: 'Totais', value: summary.totalHarvests },
          { label: 'Estoque entrada', value: summary.stockInKg },
          { label: 'Estoque saída', value: summary.stockOutKg },
        ].map((item) => (
          <div key={item.label} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{item.value.toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} />
            <strong>Filtros</strong>
          </div>
          <Button onClick={() => void handleExport()} disabled={exportReport.isPending} icon={<Download size={16} />}>
            Exportar Excel
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fase</span>
            <select value={phase} onChange={(e) => setPhase(e.target.value as OperationalReportPhase | 'TODAS')}>
              {PHASES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <Input label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input label="Ciclo" value={cycleId} onChange={(e) => setCycleId(e.target.value)} placeholder="ID do ciclo" />
          <Input label="Viveiro" value={pondId} onChange={(e) => setPondId(e.target.value)} placeholder="ID do viveiro" />
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Package size={16} />
          <strong>Fases</strong>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {PHASES.filter((item) => item.value !== 'TODAS').map((item) => (
            <div key={item.value} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 14, backgroundColor: 'rgba(2,132,199,0.06)', width: 'fit-content' }}>
              <Waves size={14} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Resumo por viveiro</h2>
        <Table
          columns={[
            { key: 'phase', header: 'Fase', render: (row: any) => row.phase },
            { key: 'label', header: 'Viveiro', render: (row: any) => row.label },
            { key: 'cycleLabel', header: 'Ciclo', render: (row: any) => row.cycleLabel },
            { key: 'feedInKg', header: 'Ração lançada', render: (row: any) => row.feedInKg.toLocaleString('pt-BR') },
            { key: 'feedOutKg', header: 'Despesca kg', render: (row: any) => row.feedOutKg.toLocaleString('pt-BR') },
            { key: 'partialHarvests', header: 'Parciais', render: (row: any) => row.partialHarvests },
            { key: 'totalHarvests', header: 'Totais', render: (row: any) => row.totalHarvests },
          ]}
          data={rows}
          rowKey={(row: any) => `${row.phase}-${row.label}-${row.cycleLabel}`}
          emptyMessage="Sem dados para os filtros escolhidos"
        />
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Lançar despesca</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
          <Input label="Ciclo" value={harvestForm.cycleId} onChange={(e) => setHarvestForm((current) => ({ ...current, cycleId: e.target.value }))} />
          <Input label="Viveiro" value={harvestForm.pondId} onChange={(e) => setHarvestForm((current) => ({ ...current, pondId: e.target.value }))} />
          <Input label="Kg" type="number" value={harvestForm.harvestedKg} onChange={(e) => setHarvestForm((current) => ({ ...current, harvestedKg: e.target.value }))} />
          <Input label="Data" type="datetime-local" value={harvestForm.harvestedAt} onChange={(e) => setHarvestForm((current) => ({ ...current, harvestedAt: e.target.value }))} />
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tipo</span>
            <select value={harvestForm.harvestType} onChange={(e) => setHarvestForm((current) => ({ ...current, harvestType: e.target.value as 'PARTIAL' | 'TOTAL' }))}>
              <option value="PARTIAL">Parcial</option>
              <option value="TOTAL">Total</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <Input label="Observação" value={harvestForm.observation} onChange={(e) => setHarvestForm((current) => ({ ...current, observation: e.target.value }))} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => void handleHarvestSubmit()} disabled={createHarvest.isPending}>
            Salvar despesca
          </Button>
        </div>
      </div>
    </div>
  );
}
