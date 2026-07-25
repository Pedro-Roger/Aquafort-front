import { useMemo, useState } from 'react';
import { Download, Filter, Package, Waves } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { useCreateHarvestRecord, useExportOperationalReports, useOperationalReports } from '../hooks/useOperationalReports';
import {
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
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
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={workspaceEyebrow}>Relatórios</div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
          Relatórios operacionais
        </h1>
        <p style={sectionSubtitle}>Exportação Excel por fase, com ração e despescas consolidadas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile }}>
        {[
          { label: 'Ração lançada', value: summary.feedInKg },
          { label: 'Despesca kg', value: summary.feedOutKg },
          { label: 'Parciais', value: summary.partialHarvests },
          { label: 'Totais', value: summary.totalHarvests },
          { label: 'Estoque entrada', value: summary.stockInKg },
          { label: 'Estoque saída', value: summary.stockOutKg },
        ].map((item) => (
          <div key={item.label} style={{ ...workspaceSurface, padding: '16px 18px' }}>
            <div style={workspaceTileLabel}>{item.label}</div>
            <div style={workspaceTileValue}>{item.value.toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </div>

      <div style={workspaceCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.inline, color: 'var(--text-primary)' }}>
            <Filter size={16} />
            <h2 style={sectionTitle}>Filtros</h2>
          </div>
          <Button onClick={() => void handleExport()} disabled={exportReport.isPending} icon={<Download size={16} />}>
            Exportar Excel
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: space.tile }}>
          <Select
            label="Fase"
            options={PHASES.map((item) => ({ value: item.value, label: item.label }))}
            value={phase}
            onChange={(e) => setPhase(e.target.value as OperationalReportPhase | 'TODAS')}
          />
          <Input label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input label="Ciclo" value={cycleId} onChange={(e) => setCycleId(e.target.value)} placeholder="ID do ciclo" />
          <Input label="Viveiro" value={pondId} onChange={(e) => setPondId(e.target.value)} placeholder="ID do viveiro" />
        </div>
      </div>

      <div style={workspaceCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.inline, color: 'var(--text-primary)' }}>
          <Package size={16} />
          <h2 style={sectionTitle}>Fases</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline }}>
          {PHASES.filter((item) => item.value !== 'TODAS').map((item) => (
            <div
              key={item.value}
              style={{
                display: 'inline-flex',
                gap: 6,
                alignItems: 'center',
                padding: '7px 12px',
                borderRadius: radius.pill,
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-dark)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Waves size={14} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={workspaceCard}>
        <h2 style={sectionTitle}>Resumo por viveiro</h2>
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

      <div style={workspaceCard}>
        <h2 style={sectionTitle}>Lançar despesca</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: space.tile }}>
          <Input label="Ciclo" value={harvestForm.cycleId} onChange={(e) => setHarvestForm((current) => ({ ...current, cycleId: e.target.value }))} />
          <Input label="Viveiro" value={harvestForm.pondId} onChange={(e) => setHarvestForm((current) => ({ ...current, pondId: e.target.value }))} />
          <Input label="Kg" type="number" value={harvestForm.harvestedKg} onChange={(e) => setHarvestForm((current) => ({ ...current, harvestedKg: e.target.value }))} />
          <Input label="Data" type="datetime-local" value={harvestForm.harvestedAt} onChange={(e) => setHarvestForm((current) => ({ ...current, harvestedAt: e.target.value }))} />
          <Select
            label="Tipo"
            options={[
              { value: 'PARTIAL', label: 'Parcial' },
              { value: 'TOTAL', label: 'Total' },
            ]}
            value={harvestForm.harvestType}
            onChange={(e) => setHarvestForm((current) => ({ ...current, harvestType: e.target.value as 'PARTIAL' | 'TOTAL' }))}
          />
        </div>
        <Input label="Observação" value={harvestForm.observation} onChange={(e) => setHarvestForm((current) => ({ ...current, observation: e.target.value }))} />
        <div>
          <Button onClick={() => void handleHarvestSubmit()} disabled={createHarvest.isPending}>
            Salvar despesca
          </Button>
        </div>
      </div>
    </div>
  );
}
