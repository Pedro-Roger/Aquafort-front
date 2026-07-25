import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft, CornerDownRight, Plus, RotateCw, ShieldAlert, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { workspaceEyebrow, workspaceSurface, workspaceTile, workspaceTileLabel, workspaceTileValue } from '../components/ui/surfaces';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { usePonds } from '../hooks/usePonds';
import { useCreateTransfer, useTransfers } from '../hooks/useTransfers';
import type { Pond, PondTransfer } from '../types';
import { PondStatus } from '../types';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

type TransferForm = {
  fromPondId: string;
  toPondId: string;
  quantity: string;
  transferDate: string;
  responsible: string;
  reason: string;
  note: string;
};

function pondLabel(pond: Pond) {
  return `${pond.code} · ${pond.name}`;
}

function statusLabel(status: PondStatus) {
  if (status === PondStatus.VAZIO) return 'Vazio';
  if (status === PondStatus.PREPARANDO) return 'Preparando';
  if (status === PondStatus.POVOADO) return 'Povoado';
  if (status === PondStatus.DESPESCANDO) return 'Despesca';
  return 'Inativo';
}

export function TransferenciaPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const { data: savedTransfers = [], isLoading: transfersLoading } = useTransfers();
  const createTransfer = useCreateTransfer();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransferForm>({
    fromPondId: '',
    toPondId: '',
    quantity: '',
    transferDate: todayIsoDate(),
    responsible: '',
    reason: '',
    note: '',
  });

  const activePonds = useMemo(
    () => ponds.filter((pond) => pond.status !== PondStatus.INATIVO),
    [ponds],
  );

  const fromOptions = activePonds.map((pond) => ({
    value: pond.id,
    label: `${pond.code} · ${pond.name}`,
  }));

  const toOptions = activePonds
    .filter((pond) => pond.id !== form.fromPondId)
    .map((pond) => ({
      value: pond.id,
      label: `${pond.code} · ${pond.name}`,
    }));

  const fromPond = activePonds.find((pond) => pond.id === form.fromPondId);
  const toPond = activePonds.find((pond) => pond.id === form.toPondId);

  useEffect(() => {
    if (!form.fromPondId && activePonds[0]) {
      setForm((current) => ({ ...current, fromPondId: activePonds[0].id }));
    }
  }, [activePonds, form.fromPondId]);

  useEffect(() => {
    if (form.fromPondId && form.fromPondId === form.toPondId) {
      setForm((current) => ({ ...current, toPondId: '' }));
    }
  }, [form.fromPondId, form.toPondId]);

  const summary = {
    totalTransfers: savedTransfers.length,
    totalQuantity: savedTransfers.reduce((sum, item) => sum + item.quantity, 0),
    uniqueRoutes: new Set(savedTransfers.map((item) => `${item.fromPondId} -> ${item.toPondId}`)).size,
    activePonds: activePonds.length,
  };

  const columns = [
    {
      key: 'transferredAt',
      header: 'Data',
      render: (row: PondTransfer) => new Date(row.transferredAt).toLocaleDateString('pt-BR'),
    },
    {
      key: 'route',
      header: 'Rota',
      render: (row: PondTransfer) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.fromPond.code}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <CornerDownRight size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {row.toPond.code}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      align: 'right' as const,
      render: (row: PondTransfer) => `${fmt(row.quantity, 0)} un`,
    },
    {
      key: 'responsible',
      header: 'Responsável',
      render: (row: PondTransfer) => row.responsible,
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row: PondTransfer) => row.reason ?? '—',
    },
  ];

  async function handleSubmit() {
    setError(null);

    const quantity = Number(form.quantity || 0);
    if (!form.fromPondId || !form.toPondId || !form.transferDate || !quantity) {
      setError('Informe origem, destino, data e quantidade.');
      return;
    }
    if (form.fromPondId === form.toPondId) {
      setError('Origem e destino precisam ser diferentes.');
      return;
    }
    if (!form.responsible.trim()) {
      setError('Informe o responsável pela transferência.');
      return;
    }

    const from = activePonds.find((pond) => pond.id === form.fromPondId);
    const to = activePonds.find((pond) => pond.id === form.toPondId);

    if (!from || !to) {
      setError('Selecione viveiros válidos.');
      return;
    }

    try {
      await createTransfer.mutateAsync({
        fromPondId: from.id,
        toPondId: to.id,
        quantity,
        transferredAt: new Date(`${form.transferDate}T12:00:00`).toISOString(),
        responsible: form.responsible.trim(),
        reason: form.reason.trim() || 'Transferência operacional',
        note: form.note.trim() || undefined,
      });
    } catch {
      setError('Não foi possível salvar a transferência. Tente novamente.');
      return;
    }

    setForm((current) => ({
      ...current,
      toPondId: '',
      quantity: '',
      transferDate: todayIsoDate(),
      responsible: '',
      reason: '',
      note: '',
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          ...workspaceSurface,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Transferência</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Movimente lotes entre viveiros sem cair no povoamento.</h1>
            <p style={{ marginTop: 10, color: 'var(--text-muted)', maxWidth: 760 }}>
              Registre a saída de um viveiro e a entrada em outro com origem, destino, quantidade e responsável.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data" type="date" value={form.transferDate} onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))} />
            </div>
            <Button size="lg" icon={<Plus size={16} />} onClick={handleSubmit}>
              Registrar
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          <StatCard label="Viveiros ativos" value={isLoading ? '-' : activePonds.length} icon={<Truck size={18} />} />
          <StatCard label="Transferências" value={summary.totalTransfers} icon={<ArrowRightLeft size={18} />} />
          <StatCard label="Unidades movidas" value={fmt(summary.totalQuantity, 0)} icon={<RotateCw size={18} />} />
          <StatCard label="Rotas únicas" value={summary.uniqueRoutes} icon={<ShieldAlert size={18} />} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Origem" options={fromOptions} value={form.fromPondId} onChange={(e) => setForm((current) => ({ ...current, fromPondId: e.target.value }))} placeholder="Selecione a origem" />
            <Select label="Destino" options={toOptions} value={form.toPondId} onChange={(e) => setForm((current) => ({ ...current, toPondId: e.target.value }))} placeholder="Selecione o destino" />
            <Input label="Quantidade" type="number" min={0} step="1" value={form.quantity} onChange={(e) => setForm((current) => ({ ...current, quantity: e.target.value }))} />
            <Input label="Responsável" value={form.responsible} onChange={(e) => setForm((current) => ({ ...current, responsible: e.target.value }))} placeholder="Nome de quem realizou" />
            <Input label="Motivo" value={form.reason} onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Ajuste operacional, separação..." />
            <Input label="Observação" value={form.note} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} placeholder="Detalhes adicionais da movimentação" />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {fromPond ? `Origem: ${pondLabel(fromPond)} (${statusLabel(fromPond.status)})` : 'Origem não selecionada'}
              {' · '}
              {toPond ? `Destino: ${pondLabel(toPond)} (${statusLabel(toPond.status)})` : 'Destino não selecionado'}
            </div>
            <Button icon={<ArrowRightLeft size={16} />} onClick={handleSubmit} loading={createTransfer.isPending}>
              Registrar transferência
            </Button>
          </div>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.18)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <InfoCard title="Origem" value={fromPond ? pondLabel(fromPond) : 'Selecione um viveiro'} />
            <InfoCard title="Destino" value={toPond ? pondLabel(toPond) : 'Selecione um destino'} />
            <InfoCard title="Resumo" value={`${summary.totalTransfers} transferências salvas`} />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Transferências recentes</div>
          <Table columns={columns} data={savedTransfers} rowKey={(row) => row.id} loading={transfersLoading} emptyMessage="Nenhuma transferência registrada ainda" />
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div style={{ ...workspaceTile, minHeight: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={workspaceTileLabel}>{label}</div>
        <span style={{ width: 34, height: 34, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>
          {icon}
        </span>
      </div>
      <div style={{ ...workspaceTileValue, marginTop: 12, fontSize: 24, letterSpacing: '-0.04em' }}>{value}</div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14, backgroundColor: 'var(--bg-elevated)' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      <div style={{ marginTop: 8, color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}
