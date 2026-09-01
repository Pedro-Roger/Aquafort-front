import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft, CornerDownRight, Edit2, Plus, RotateCw, ShieldAlert, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  metricGrid,
  pageStack,
  radius,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { UnitToggle } from '../components/ui/UnitToggle';
import { useAuth } from '../hooks/useAuth';
import { usePonds } from '../hooks/usePonds';
import { useCreateTransfer, useTransfers, useUpdateTransfer } from '../hooks/useTransfers';
import { averageWeightGToPlPerGram, isBercarioPondType, plPerGramToAverageWeightG } from '../lib/plPerGram';
import type { Pond, PondTransfer } from '../types';
import { PondStatus, PondType } from '../types';

/**
 * RF-21 (plano técnico de unificação): mesmo padrão de HarvestType/closesCycle
 * em OperationalReportsPage.tsx, com um terceiro valor neutro (`AUTO`) que
 * representa "operador não decidiu" sem fingir ser uma decisão real — ver
 * comentário em `TransferForm.transferType`.
 */
type TransferType = 'AUTO' | 'PARTIAL' | 'TOTAL';

/** Mesma unidade de entrada usada em BiometricsModalForm.tsx (RN-10) — bercario entra em PL/g por padrão, os demais tipos em gramas. */
type WeightEntryUnit = 'pl_per_gram' | 'grams';

/** Keeps switch-triggered conversions readable, mesmo helper usado em BiometricsModalForm.tsx. */
function formatConvertedValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Number(value.toFixed(6)));
}

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
  /** RF-13/plano técnico: peso médio/PL-g opcional, sempre convertido para gramas antes de enviar (averageWeightG). */
  weightInput: string;
  /**
   * RF-21: decisão explícita do operador — Parcial mantém o ciclo de origem
   * ativo, Total encerra (closesOriginCycle). `AUTO` é o valor inicial/neutro
   * ("Automático (recomendado)" na tela) e representa "operador não decidiu
   * ainda" — não temos, nesta tela, a população restante do ciclo de origem
   * calculada em nenhuma consulta existente (usePonds/useTransfers não
   * trazem isso), então não arriscamos pré-selecionar "Parcial" ou "Total"
   * como se fosse uma decisão real quando não é. Enquanto `transferType` for
   * `AUTO`, o campo simplesmente não é enviado no payload (ver handleSubmit)
   * e o backend aplica o próprio default de RF-21 (quantity >= população
   * restante → true), que já faz essa conta corretamente no servidor. Só
   * quando o operador escolhe "Parcial" ou "Total" no Select é que
   * `transferType` passa a refletir uma decisão de fato — o enum de 3
   * valores já descreve sozinho as 3 situações possíveis (não decidido /
   * decidido Parcial / decidido Total), então não precisamos de um booleano
   * `touched` separado para isso.
   */
  transferType: TransferType;
};

function pondLabel(pond: Pond) {
  return `${pond.code} · ${pond.name}`;
}

/**
 * Ordena viveiros colocando o `priorityType` no topo (ex.: berçário primeiro
 * na Origem, engorda primeiro no Destino — fluxo real da fazenda é
 * berçário -> engorda). Dentro de cada grupo, ordena por código para manter
 * uma ordem estável e previsível.
 */
function sortPondsByPriorityType(ponds: Pond[], priorityType: PondType): Pond[] {
  return [...(ponds ?? [])].sort((a, b) => {
    const aPriority = a.type === priorityType ? 0 : 1;
    const bPriority = b.type === priorityType ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.code.localeCompare(b.code, 'pt-BR', { numeric: true });
  });
}

function statusLabel(status: PondStatus) {
  if (status === PondStatus.VAZIO) return 'Vazio';
  if (status === PondStatus.PREPARANDO) return 'Preparando';
  if (status === PondStatus.POVOADO) return 'Povoado';
  if (status === PondStatus.DESPESCANDO) return 'Despesca';
  return 'Inativo';
}

export function TransferenciaPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: ponds = [], isLoading } = usePonds();
  const { data: savedTransfers = [], isLoading: transfersLoading } = useTransfers();
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransferForm>({
    fromPondId: '',
    toPondId: '',
    quantity: '',
    transferDate: todayIsoDate(),
    responsible: '',
    reason: '',
    note: '',
    weightInput: '',
    transferType: 'AUTO',
  });
  const [editingTransfer, setEditingTransfer] = useState<PondTransfer | null>(null);
  const [editForm, setEditForm] = useState<TransferForm>({
    fromPondId: '',
    toPondId: '',
    quantity: '',
    transferDate: todayIsoDate(),
    responsible: '',
    reason: '',
    note: '',
    weightInput: '',
    transferType: 'AUTO',
  });
  // RF-13/plano técnico: berçário mede em PL/g (padrão do fluxo de campo),
  // os demais tipos de viveiro em gramas — mesma regra de BiometricsModalForm (RN-10).
  const [weightUnit, setWeightUnit] = useState<WeightEntryUnit>('grams');

  const activePonds = useMemo(
    () => ponds.filter((pond) => pond.status !== PondStatus.INATIVO),
    [ponds],
  );

  // Origem só faz sentido para viveiro com estoque de verdade (ciclo em
  // andamento). VAZIO/PREPARANDO/DESPESCANDO não entram — evita origem
  // "fantasma" sem lote pra transferir. Destino continua aceitando qualquer
  // status ativo (inclusive VAZIO/PREPARANDO), já que transferir PARA um
  // viveiro vazio é um caso válido.
  const originCandidatePonds = useMemo(
    () => activePonds.filter((pond) => pond.status === PondStatus.POVOADO),
    [activePonds],
  );

  const sortedOriginPonds = useMemo(
    () => sortPondsByPriorityType(originCandidatePonds, PondType.BERCARIO),
    [originCandidatePonds],
  );

  const sortedDestinationPonds = useMemo(
    () => sortPondsByPriorityType(activePonds, PondType.ENGORDA),
    [activePonds],
  );

  const fromOptions = sortedOriginPonds.map((pond) => ({
    value: pond.id,
    label: pondLabel(pond),
  }));

  const toOptions = sortedDestinationPonds
    .filter((pond) => pond.id !== form.fromPondId)
    .map((pond) => ({
      value: pond.id,
      label: pondLabel(pond),
    }));

  const fromPond = activePonds.find((pond) => pond.id === form.fromPondId);
  const toPond = activePonds.find((pond) => pond.id === form.toPondId);

  // RN-12 (spec viveiros-e-ciclos, "Ajustes — plano técnico de unificação do
  // fluxo de transferência", 2026-08-17): o bloqueio de curto prazo saiu daqui
  // — o backend (TransfersService.create) agora cria o ciclo de destino
  // automaticamente quando o viveiro de destino está VAZIO, então a tela não
  // precisa mais barrar a submissão nesse caso.
  const isOriginBercario = isBercarioPondType(fromPond?.type);

  useEffect(() => {
    if (!form.fromPondId && sortedOriginPonds[0]) {
      setForm((current) => ({ ...current, fromPondId: sortedOriginPonds[0].id }));
    }
  }, [sortedOriginPonds, form.fromPondId]);

  useEffect(() => {
    if (form.fromPondId && form.fromPondId === form.toPondId) {
      setForm((current) => ({ ...current, toPondId: '' }));
    }
  }, [form.fromPondId, form.toPondId]);

  // RF-13/plano técnico: a origem só é conhecida depois de selecionada — ao
  // trocar de berçário para outro tipo (ou vice-versa), troca a unidade de
  // entrada e limpa o valor digitado (evita number "PL/g" sendo enviado como
  // se fosse grama, ou vice-versa).
  useEffect(() => {
    setWeightUnit(isOriginBercario ? 'pl_per_gram' : 'grams');
    setForm((current) => (current.weightInput ? { ...current, weightInput: '' } : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOriginBercario]);

  function handleWeightUnitChange(nextUnit: WeightEntryUnit) {
    if (nextUnit === weightUnit) return;
    setForm((current) => {
      const rawValue = Number(current.weightInput);
      if (!current.weightInput || !Number.isFinite(rawValue) || rawValue <= 0) {
        return { ...current, weightInput: '' };
      }
      const converted = nextUnit === 'grams'
        ? plPerGramToAverageWeightG(rawValue)
        : averageWeightGToPlPerGram(rawValue);
      return { ...current, weightInput: formatConvertedValue(converted) };
    });
    setWeightUnit(nextUnit);
  }

  const weightLabel = weightUnit === 'pl_per_gram' ? 'PL/grama' : 'Peso médio (g)';

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
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: PondTransfer) => (
              <Button icon={<Edit2 size={14} />} onClick={() => handleEditOpen(row)} variant="ghost" />
            ),
          },
        ]
      : []),
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

    // RF-13/plano técnico: peso/PL-g é opcional — nunca força um valor no
    // payload, só converte e envia quando o operador de fato digitou algo.
    const rawWeight = Number(form.weightInput);
    const averageWeightG = form.weightInput.trim() && Number.isFinite(rawWeight) && rawWeight > 0
      ? (weightUnit === 'pl_per_gram' ? plPerGramToAverageWeightG(rawWeight) : rawWeight)
      : undefined;

    try {
      await createTransfer.mutateAsync({
        fromPondId: from.id,
        toPondId: to.id,
        quantity,
        transferredAt: new Date(`${form.transferDate}T12:00:00`).toISOString(),
        responsible: form.responsible.trim(),
        reason: form.reason.trim() || 'Transferência operacional',
        note: form.note.trim() || undefined,
        // RF-21: só envia closesOriginCycle quando o operador de fato
        // escolheu "Parcial" ou "Total" no seletor — enquanto `transferType`
        // for `AUTO` (valor inicial/neutro, nunca uma decisão real), o campo
        // fica de fora do payload. Sem isso, um "Parcial" pré-selecionado
        // sem o operador tocar ia ser enviado como false mesmo numa
        // transferência que esvaziou o viveiro de origem por completo,
        // deixando o ciclo de origem ativo com a contagem cheia (o mesmo
        // bug do VB104/VE204, só que por default de UI em vez de ausência de
        // funcionalidade). Ausente = backend aplica o próprio default de
        // RF-21 (quantity >= população restante → true), que já calcula essa
        // conta corretamente no servidor.
        ...(form.transferType !== 'AUTO' ? { closesOriginCycle: form.transferType === 'TOTAL' } : {}),
        ...(averageWeightG !== undefined ? { averageWeightG } : {}),
      });
    } catch (saveError: unknown) {
      const errorMessage = typeof saveError === 'object' && saveError !== null && 'response' in saveError
        ? (saveError as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const fallbackMessage = saveError instanceof Error ? saveError.message : undefined;
      setError(errorMessage ?? fallbackMessage ?? 'Não foi possível salvar a transferência. Tente novamente.');
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
      weightInput: '',
      transferType: 'AUTO',
    }));
  }

  function handleEditOpen(transfer: PondTransfer) {
    setEditingTransfer(transfer);
    setEditForm({
      fromPondId: transfer.fromPondId,
      toPondId: transfer.toPondId,
      quantity: String(transfer.quantity),
      transferDate: transfer.transferredAt.slice(0, 10),
      responsible: transfer.responsible,
      reason: transfer.reason ?? '',
      note: transfer.note ?? '',
      weightInput: transfer.averageWeightG != null ? String(transfer.averageWeightG) : '',
      transferType: transfer.closesOriginCycle === undefined ? 'AUTO' : transfer.closesOriginCycle ? 'TOTAL' : 'PARTIAL',
    });
    setWeightUnit(isOriginBercario ? 'pl_per_gram' : 'grams');
  }

  function handleEditCancel() {
    setEditingTransfer(null);
  }

  async function handleEditSubmit() {
    if (!editingTransfer) return;
    setError(null);

    const quantity = Number(editForm.quantity || 0);
    if (!editForm.fromPondId || !editForm.toPondId || !editForm.transferDate || !quantity) {
      setError('Informe origem, destino, data e quantidade.');
      return;
    }
    if (!editForm.responsible.trim()) {
      setError('Informe o responsável pela transferência.');
      return;
    }

    const rawWeight = Number(editForm.weightInput);
    const averageWeightG = editForm.weightInput.trim() && Number.isFinite(rawWeight) && rawWeight > 0
      ? (weightUnit === 'pl_per_gram' ? plPerGramToAverageWeightG(rawWeight) : rawWeight)
      : undefined;

    try {
      await updateTransfer.mutateAsync({
        id: editingTransfer.id,
        dto: {
          quantity,
          transferredAt: new Date(`${editForm.transferDate}T12:00:00`).toISOString(),
          responsible: editForm.responsible.trim(),
          reason: editForm.reason.trim() || 'Transferência operacional',
          note: editForm.note.trim() || undefined,
          ...(editForm.transferType !== 'AUTO' ? { closesOriginCycle: editForm.transferType === 'TOTAL' } : {}),
          ...(averageWeightG !== undefined ? { averageWeightG } : {}),
        },
      });
      setEditingTransfer(null);
    } catch (saveError: unknown) {
      const errorMessage = typeof saveError === 'object' && saveError !== null && 'response' in saveError
        ? (saveError as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const fallbackMessage = saveError instanceof Error ? saveError.message : undefined;
      setError(errorMessage ?? fallbackMessage ?? 'Não foi possível atualizar a transferência. Tente novamente.');
      return;
    }
  }

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Transferência</div>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data" type="date" value={form.transferDate} onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))} />
            </div>
            <Button icon={<Plus size={16} />} onClick={handleSubmit}>
              Registrar
            </Button>
          </div>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <StatCard label="Viveiros ativos" value={isLoading ? '-' : activePonds.length} icon={<Truck size={18} />} />
          <StatCard label="Transferências" value={summary.totalTransfers} icon={<ArrowRightLeft size={18} />} />
          <StatCard label="Unidades movidas" value={fmt(summary.totalQuantity, 0)} icon={<RotateCw size={18} />} />
          <StatCard label="Rotas únicas" value={summary.uniqueRoutes} icon={<ShieldAlert size={18} />} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: space.page, alignItems: 'start' }}>
        <div style={workspaceCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Origem" options={fromOptions} value={form.fromPondId} onChange={(e) => setForm((current) => ({ ...current, fromPondId: e.target.value }))} placeholder="Selecione a origem" />
            <Select label="Destino" options={toOptions} value={form.toPondId} onChange={(e) => setForm((current) => ({ ...current, toPondId: e.target.value }))} placeholder="Selecione o destino" />
            <Input label="Quantidade" type="number" min={0} step="1" value={form.quantity} onChange={(e) => setForm((current) => ({ ...current, quantity: e.target.value }))} />
            <Input label="Responsável" value={form.responsible} onChange={(e) => setForm((current) => ({ ...current, responsible: e.target.value }))} placeholder="Nome de quem realizou" />
            <Input label="Motivo" value={form.reason} onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Ajuste operacional, separação..." />
            <Input label="Observação" value={form.note} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} placeholder="Detalhes adicionais da movimentação" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isOriginBercario && (
                <UnitToggle
                  ariaLabel="Unidade de entrada"
                  value={weightUnit}
                  onChange={handleWeightUnitChange}
                  options={[
                    { unit: 'pl_per_gram', label: 'PL/g' },
                    { unit: 'grams', label: 'Peso (g)' },
                  ]}
                />
              )}
              <Input
                label={weightLabel}
                type="number"
                step={weightUnit === 'pl_per_gram' ? '1' : '0.01'}
                value={form.weightInput}
                onChange={(e) => setForm((current) => ({ ...current, weightInput: e.target.value }))}
                placeholder={weightUnit === 'pl_per_gram' ? 'Pós-larvas por grama (opcional)' : 'Peso médio em gramas (opcional)'}
              />
            </div>
            <Select
              label="Tipo de transferência"
              options={[
                { value: 'AUTO', label: 'Automático (recomendado)' },
                { value: 'PARTIAL', label: 'Parcial' },
                { value: 'TOTAL', label: 'Total' },
              ]}
              value={form.transferType}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  transferType: e.target.value as TransferType,
                }))
              }
            />
          </div>

          <div style={{ display: 'flex', gap: space.tile, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: space.section }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {fromPond ? `Origem: ${pondLabel(fromPond)} (${statusLabel(fromPond.status)})` : 'Origem não selecionada'}
              {' · '}
              {toPond ? `Destino: ${pondLabel(toPond)} (${statusLabel(toPond.status)})` : 'Destino não selecionado'}
            </div>
            <Button
              icon={<ArrowRightLeft size={16} />}
              onClick={handleSubmit}
              loading={createTransfer.isPending}
            >
              Registrar transferência
            </Button>
          </div>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: radius.tile, backgroundColor: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.18)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: space.tile }}>
            <InfoCard title="Origem" value={fromPond ? pondLabel(fromPond) : 'Selecione um viveiro'} />
            <InfoCard title="Destino" value={toPond ? pondLabel(toPond) : 'Selecione um destino'} />
            <InfoCard title="Resumo" value={`${summary.totalTransfers} transferências salvas`} />
          </div>
        </div>

        <div style={workspaceCard}>
          <h2 style={sectionTitle}>Transferências recentes</h2>
          <Table columns={columns} data={savedTransfers} rowKey={(row) => row.id} loading={transfersLoading} emptyMessage="Nenhuma transferência registrada ainda" />
        </div>
      </div>

      {editingTransfer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleEditCancel}
        >
          <div
            style={{
              ...workspaceCard,
              width: 'min(560px, 90vw)',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.section }}>
              <h2 style={sectionTitle}>Editar transferência</h2>
              <Button icon={<Edit2 size={16} />} variant="ghost" onClick={handleEditCancel} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Quantidade" type="number" min={0} step={1} value={editForm.quantity} onChange={(e) => setEditForm((current) => ({ ...current, quantity: e.target.value }))} />
              <Input label="Data" type="date" value={editForm.transferDate} onChange={(e) => setEditForm((current) => ({ ...current, transferDate: e.target.value }))} />
              <Input label="Responsável" value={editForm.responsible} onChange={(e) => setEditForm((current) => ({ ...current, responsible: e.target.value }))} placeholder="Nome de quem realizou" />
              <Input label="Motivo" value={editForm.reason} onChange={(e) => setEditForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Ajuste operacional, separação..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Observação" value={editForm.note} onChange={(e) => setEditForm((current) => ({ ...current, note: e.target.value }))} placeholder="Detalhes adicionais da movimentação" />
              <Select
                label="Tipo de transferência"
                options={[
                  { value: 'AUTO', label: 'Automático (recomendado)' },
                  { value: 'PARTIAL', label: 'Parcial' },
                  { value: 'TOTAL', label: 'Total' },
                ]}
                value={editForm.transferType}
                onChange={(e) => setEditForm((current) => ({ ...current, transferType: e.target.value as TransferType }))}
              />
            </div>

            <div style={{ display: 'flex', gap: space.inline, justifyContent: 'flex-end', marginTop: space.section, borderTop: '1px solid var(--border)', paddingTop: space.section }}>
              <Button variant="ghost" onClick={handleEditCancel}>Cancelar</Button>
              <Button icon={<Edit2 size={16} />} onClick={handleEditSubmit} loading={updateTransfer.isPending}>
                Salvar alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div style={{ ...workspaceTile, minHeight: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={workspaceTileLabel}>{label}</div>
        <span style={{ width: 34, height: 34, borderRadius: radius.control, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>
          {icon}
        </span>
      </div>
      <div style={{ ...workspaceTileValue, marginTop: 10 }}>{value}</div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ ...workspaceTile, padding: 14 }}>
      <div style={workspaceTileLabel}>{title}</div>
      <div style={{ marginTop: 8, color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}
