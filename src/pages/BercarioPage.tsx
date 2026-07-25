import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FlaskConical, Layers, Plus, Beaker, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { usePonds } from '../hooks/usePonds';
import { useNurseryActivities, useCreateNurseryActivity } from '../hooks/useNursery';
import { PondType } from '../types';
import { pageStack, radius, sectionSubtitle, sectionTitle, space, workspaceCard, workspaceEyebrow, workspaceSurface, workspaceTile, workspaceTileLabel, workspaceTileValue } from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';

function fmt(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

type NurseryForm = {
  pondId: string;
  measuredAt: string;
  plGram: string;
  probioticKg: string;
  bicarbonateKg: string;
  chlorineKg: string;
  bokashiKg: string;
  waterManagementType: string;
  waterManagementNote: string;
  observation: string;
};

export function BercarioPage() {
  const { data: ponds = [], isLoading: pondsLoading } = usePonds({ type: PondType.BERCARIO });
  const [date, setDate] = useState(todayIsoDate());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NurseryForm>({
    pondId: '',
    measuredAt: todayIsoDate(),
    plGram: '',
    probioticKg: '',
    bicarbonateKg: '',
    chlorineKg: '',
    bokashiKg: '',
    waterManagementType: '',
    waterManagementNote: '',
    observation: '',
  });

  const records = useNurseryActivities({ date });
  const createActivity = useCreateNurseryActivity();

  useEffect(() => {
    if (!form.pondId && ponds.length) {
      setForm((current) => ({ ...current, pondId: ponds[0].id }));
    }
  }, [ponds, form.pondId]);

  const pondOptions = ponds.map((pond) => ({
    value: pond.id,
    label: `${pond.code} · ${pond.name}`,
  }));

  const groupedByPond = useMemo(() => {
    return ponds.map((pond) => {
      const latest = records.data?.find((record) => record.pondId === pond.id) ?? null;
      return { pond, latest };
    });
  }, [ponds, records.data]);

  const todayRecords = records.data ?? [];
  const totals = todayRecords.reduce(
    (acc, record) => {
      acc.plGram += Number(record.plGram ?? 0);
      acc.probioticKg += Number(record.probioticKg ?? 0);
      acc.bicarbonateKg += Number(record.bicarbonateKg ?? 0);
      acc.chlorineKg += Number(record.chlorineKg ?? 0);
      acc.bokashiKg += Number(record.bokashiKg ?? 0);
      return acc;
    },
    { plGram: 0, probioticKg: 0, bicarbonateKg: 0, chlorineKg: 0, bokashiKg: 0 },
  );

  const columns = [
    {
      key: 'measuredAt',
      header: 'Data',
      render: (row: (typeof todayRecords)[number]) => new Date(row.measuredAt).toLocaleDateString('pt-BR'),
    },
    {
      key: 'pond',
      header: 'Berçário',
      render: (row: (typeof todayRecords)[number]) => `${row.pond.code} · ${row.pond.name}`,
    },
    {
      key: 'plGram',
      header: 'PL grama',
      align: 'right' as const,
      render: (row: (typeof todayRecords)[number]) => `${fmt(row.plGram, 2)} g`,
    },
    {
      key: 'inputs',
      header: 'Insumos',
      render: (row: (typeof todayRecords)[number]) => {
        const inputs = [
          row.probioticKg ? `Probiótico ${fmt(row.probioticKg, 2)} kg` : null,
          row.bicarbonateKg ? `Bicarbonato ${fmt(row.bicarbonateKg, 2)} kg` : null,
          row.chlorineKg ? `Cloro ${fmt(row.chlorineKg, 2)} kg` : null,
          row.bokashiKg ? `Bokashi ${fmt(row.bokashiKg, 2)} kg` : null,
        ].filter(Boolean);
        return inputs.length ? inputs.join(' · ') : '—';
      },
    },
    {
      key: 'water',
      header: 'Manejo de água',
      render: (row: (typeof todayRecords)[number]) =>
        row.waterManagementType
          ? `${row.waterManagementType}${row.waterManagementNote ? ` · ${row.waterManagementNote}` : ''}`
          : '—',
    },
  ];

  async function handleSubmit() {
    setError(null);
    if (!form.pondId || !form.measuredAt || !form.plGram) {
      setError('Berçário, data e PL grama são obrigatórios.');
      return;
    }

    try {
      await createActivity.mutateAsync({
        pondId: form.pondId,
        measuredAt: form.measuredAt,
        plGram: Number(form.plGram),
        probioticKg: form.probioticKg ? Number(form.probioticKg) : undefined,
        bicarbonateKg: form.bicarbonateKg ? Number(form.bicarbonateKg) : undefined,
        chlorineKg: form.chlorineKg ? Number(form.chlorineKg) : undefined,
        bokashiKg: form.bokashiKg ? Number(form.bokashiKg) : undefined,
        waterManagementType: form.waterManagementType || undefined,
        waterManagementNote: form.waterManagementNote || undefined,
        observation: form.observation || undefined,
      });

      setForm({
        pondId: form.pondId,
        measuredAt: todayIsoDate(),
        plGram: '',
        probioticKg: '',
        bicarbonateKg: '',
        chlorineKg: '',
        bokashiKg: '',
        waterManagementType: '',
        waterManagementNote: '',
        observation: '',
      });
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao registrar berçário.');
    }
  }

  return (
    <div style={{ ...pageStack, height: '100%' }}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Berçário</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
              PL grama, insumos e manejo operacional.
            </h1>
            <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 760 }}>
              Registre somente viveiros do tipo berçário, com biometria de PL grama e manejo de água opcional.
            </p>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setOpen(true)}>
              Novo registro
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile, marginTop: space.section }}>
          <StatCard label="Berçários ativos" value={pondsLoading ? '-' : ponds.length} icon={<Layers size={18} />} />
          <StatCard label="Registros do dia" value={records.isLoading ? '-' : todayRecords.length} icon={<ShieldCheck size={18} />} />
          <StatCard label="PL grama" value={`${fmt(totals.plGram, 2)} g`} icon={<FlaskConical size={18} />} />
          <StatCard label="Insumos usados" value={`${fmt(totals.probioticKg + totals.bicarbonateKg + totals.chlorineKg + totals.bokashiKg, 2)} kg`} icon={<Beaker size={18} />} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: space.page, minHeight: 0, flex: 1 }}>
        <div style={{ ...workspaceCard, minHeight: 0 }}>
          <h2 style={sectionTitle}>Viveiros de berçário</h2>
          <div style={{ display: 'grid', gap: space.inline, overflowY: 'auto', alignContent: 'start' }}>
            {groupedByPond.map(({ pond, latest }) => (
              <div key={pond.id} style={{ ...workspaceTile, padding: 14, borderRadius: radius.tile }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pond.code}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{pond.name}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>PL g: {latest ? fmt(latest.plGram, 2) : '—'}</div>
                </div>
                <div style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 12 }}>
                  Insumos: {latest ? [latest.probioticKg, latest.bicarbonateKg, latest.chlorineKg, latest.bokashiKg].some(Boolean) ? 'registrados' : 'sem uso no dia' : 'sem registro'}
                </div>
                <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                  Manejo de água: {latest?.waterManagementType ?? '—'}
                </div>
              </div>
            ))}
            {!pondsLoading && ponds.length === 0 && (
              <EmptyState
                title="Nenhum viveiro do tipo berçário encontrado."
                description="Cadastre um viveiro do tipo berçário para registrar PL grama e insumos."
              />
            )}
          </div>
        </div>

        <div style={{ ...workspaceCard, minHeight: 0 }}>
          <h2 style={sectionTitle}>Registros do dia</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Table columns={columns} data={todayRecords} rowKey={(row) => row.id} loading={records.isLoading} emptyMessage="Nenhum registro para a data selecionada" />
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo registro de berçário" width={760}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Select label="Berçário" options={pondOptions} value={form.pondId} onChange={(e) => setForm((current) => ({ ...current, pondId: e.target.value }))} />
          <Input label="Data" type="date" value={form.measuredAt} onChange={(e) => setForm((current) => ({ ...current, measuredAt: e.target.value }))} />
          <Input label="PL grama" type="number" step="0.01" value={form.plGram} onChange={(e) => setForm((current) => ({ ...current, plGram: e.target.value }))} />
          <Input label="Probiótico (kg)" type="number" step="0.01" value={form.probioticKg} onChange={(e) => setForm((current) => ({ ...current, probioticKg: e.target.value }))} />
          <Input label="Bicarbonato (kg)" type="number" step="0.01" value={form.bicarbonateKg} onChange={(e) => setForm((current) => ({ ...current, bicarbonateKg: e.target.value }))} />
          <Input label="Cloro (kg)" type="number" step="0.01" value={form.chlorineKg} onChange={(e) => setForm((current) => ({ ...current, chlorineKg: e.target.value }))} />
          <Input label="Bokashi (kg)" type="number" step="0.01" value={form.bokashiKg} onChange={(e) => setForm((current) => ({ ...current, bokashiKg: e.target.value }))} />
          <Input label="Manejo de água" value={form.waterManagementType} onChange={(e) => setForm((current) => ({ ...current, waterManagementType: e.target.value }))} placeholder="Ex.: troca parcial, sifonagem, renovação" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Obs. manejo de água" value={form.waterManagementNote} onChange={(e) => setForm((current) => ({ ...current, waterManagementNote: e.target.value }))} placeholder="Opcional" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Observação" value={form.observation} onChange={(e) => setForm((current) => ({ ...current, observation: e.target.value }))} placeholder="Opcional" />
          </div>
          {error && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={createActivity.isPending} onClick={handleSubmit} disabled={!form.pondId || !form.measuredAt || !form.plGram}>
              Salvar registro
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div style={{ ...workspaceTile, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
        <span style={workspaceTileLabel}>{label}</span>
        {icon}
      </div>
      <div style={workspaceTileValue}>{value}</div>
    </div>
  );
}
