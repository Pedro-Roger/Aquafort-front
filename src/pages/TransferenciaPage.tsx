import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft, CornerDownRight, Plus, RotateCw, ShieldAlert, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { usePonds } from '../hooks/usePonds';
import type { Pond } from '../types';
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

type TransferRecord = {
  id: string;
  from: string;
  to: string;
  quantity: number;
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

function makeTransferId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TransferenciaPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const [error, setError] = useState<string | null>(null);
  const [savedTransfers, setSavedTransfers] = useState<TransferRecord[]>([]);
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
    uniqueRoutes: new Set(savedTransfers.map((item) => `${item.from} -> ${item.to}`)).size,
    activePonds: activePonds.length,
  };

  const columns = [
    {
      key: 'transferDate',
      header: 'Data',
      render: (row: TransferRecord) => new Date(row.transferDate).toLocaleDateString('pt-BR'),
    },
    {
      key: 'route',
      header: 'Rota',
      render: (row: TransferRecord) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.from}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <CornerDownRight size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {row.to}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      align: 'right' as const,
      render: (row: TransferRecord) => `${fmt(row.quantity, 0)} un`,
    },
    {
      key: 'responsible',
      header: 'Responsável',
      render: (row: TransferRecord) => row.responsible,
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row: TransferRecord) => row.reason,
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

    setSavedTransfers((current) => [
      {
        id: makeTransferId(),
        from: pondLabel(from),
        to: pondLabel(to),
        quantity,
        transferDate: form.transferDate,
        responsible: form.responsible.trim(),
        reason: form.reason.trim() || 'Transferência operacional',
        note: form.note.trim(),
      },
      ...current,
    ]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div
        style={{
          borderRadius: 28,
          padding: 24,
          color: '#f8fafc',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(14,116,144,0.94))',
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.14)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>Transferência</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Movimente lotes entre viveiros sem cair no povoamento.</h1>
            <p style={{ marginTop: 10, color: 'rgba(248,250,252,0.78)', maxWidth: 760 }}>
              Registre a saída de um viveiro e a entrada em outro com origem, destino, quantidade e responsável.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data" type="date" value={form.transferDate} onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))} />
            </div>
            <Button size="lg" icon={<Plus size={16} />} onClick={handleSubmit} style={{ backgroundColor: '#fff', color: '#0f172a', boxShadow: 'none' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: 16, minHeight: 0, flex: 1 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <Button icon={<ArrowRightLeft size={16} />} onClick={handleSubmit}>
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
            <InfoCard title="Resumo" value={`${summary.totalTransfers} lançamentos registrados localmente`} />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Transferências recentes</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Table columns={columns} data={savedTransfers} rowKey={(row) => row.id} emptyMessage="Nenhuma transferência registrada ainda" />
          </div>
        </div>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Você pode expandir esta tela depois para gravar no backend sem mudar a navegação.
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, minHeight: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ color: 'rgba(248,250,252,0.72)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <span style={{ width: 34, height: 34, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' }}>
          {icon}
        </span>
      </div>
      <div style={{ marginTop: 12, fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em' }}>{value}</div>
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
