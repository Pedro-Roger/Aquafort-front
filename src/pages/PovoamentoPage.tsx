import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { OriginPicker, type OriginOption } from '../components/povoamento/OriginPicker';
import { QuantityWeightInput } from '../components/povoamento/QuantityWeightInput';
import { SelectablePondChips } from '../components/povoamento/SelectablePondChips';
import { useCreateCycle, useCycles } from '../hooks/useCycles';
import { useCreateBiometric } from '../hooks/useBiometrics';
import { usePonds } from '../hooks/usePonds';
import { useAuth } from '../hooks/useAuth';
import type { Pond } from '../types';
import { PondType } from '../types';
import {
  controlHeight,
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceLink,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import {
  calculatePovoamentoQuantity,
  calculateStageDay,
  collectTransferOriginCycleIds,
  getAllocationSummary,
  getCyclePhaseForPondType,
  sumOriginQuantities,
  validateAllocationRows,
  validateTransferBiometry,
  type AllocationRow,
} from './povoamento';
import { getPondTypeLabel, getPondTypeShortLabel } from '../lib/pondLabels';
import { plPerGramToAverageWeightG } from '../lib/plPerGram';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const BERCARIO_POND_TYPES = [PondType.PRE_BERCARIO, PondType.BERCARIO] as const;
const VIVEIRO_POND_TYPES = [PondType.ENGORDA] as const;
const ALL_STOCKING_POND_TYPES = [...BERCARIO_POND_TYPES, ...VIVEIRO_POND_TYPES] as const;
type StockingPondType = (typeof ALL_STOCKING_POND_TYPES)[number];

type StockingMode = 'BERCARIO' | 'VIVEIRO';
type ViveiroSubMode = 'DIRETO' | 'TRANSFERENCIA';

function targetPondTypesForMode(mode: StockingMode): readonly StockingPondType[] {
  return mode === 'BERCARIO' ? BERCARIO_POND_TYPES : VIVEIRO_POND_TYPES;
}

type PovoamentoForm = {
  geneticCode: string;
  supplier: string;
  lotCode: string;
  density: string;
  bonusPct: string;
  biometria: string;
  stageDayOverride: string;
  transferDate: string;
  plPerGram: string;
  /** RF-14: required alongside plPerGram in transfer mode — becomes sampleCount on the origin biometria. */
  sampleCount: string;
  stockDate: string;
};

type AllocationRowState = AllocationRow & { id: string };

function makeRow(pondId = ''): AllocationRowState {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, pondId, quantity: 0, weightG: 0 };
}

function pondLabel(pond: Pond) {
  return `${pond.code} · ${pond.name}`;
}

export function PovoamentoPage() {
  const { user } = useAuth();
  const { data: ponds = [], isLoading } = usePonds();
  const createCycle = useCreateCycle();
  const createBiometric = useCreateBiometric();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<StockingMode>('BERCARIO');
  const [viveiroSubMode, setViveiroSubMode] = useState<ViveiroSubMode>('DIRETO');
  const [selectedTankIds, setSelectedTankIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<PovoamentoForm>({
    geneticCode: '',
    supplier: '',
    lotCode: '',
    density: '',
    bonusPct: '',
    biometria: '',
    stageDayOverride: '',
    transferDate: '',
    plPerGram: '',
    sampleCount: '',
    stockDate: todayIsoDate(),
  });
  const [allocations, setAllocations] = useState<AllocationRowState[]>([]);

  const isTransferMode = mode === 'VIVEIRO' && viveiroSubMode === 'TRANSFERENCIA';

  const targetPonds = useMemo(
    () => ponds.filter((pond) => targetPondTypesForMode(mode).includes(pond.type as StockingPondType)),
    [ponds, mode],
  );
  const selectedPonds = useMemo(() => new Map(ponds.map((pond) => [pond.id, pond])), [ponds]);

  const { data: bercarioOrigins = [] } = useCycles({ status: 'ativo', phase: 'BERCARIO' });

  const originOptions: OriginOption[] = bercarioOrigins.map((cycle) => ({
    cycleId: cycle.id,
    label: `${cycle.pond?.code ?? cycle.pondId} · ${fmt(cycle.plCount, 0)} PL`,
    plCount: cycle.plCount,
    allocatedElsewhere: (cycle as unknown as { originAllocated?: number }).originAllocated ?? 0,
  }));

  // Últimos povoamentos salvos — busca real no servidor (não só o que foi
  // criado nesta sessão), filtrado pelo tipo de tanque do modo atual.
  const { data: activeCyclesForMode = [] } = useCycles({ status: 'ativo' });

  const recentPovoamentos = activeCyclesForMode
    .filter((cycle) => {
      const pondType = selectedPonds.get(cycle.pondId)?.type ?? cycle.pond?.type;
      return pondType ? targetPondTypesForMode(mode).includes(pondType as StockingPondType) : false;
    })
    .slice()
    .sort((a, b) => new Date(b.stockDate).getTime() - new Date(a.stockDate).getTime())
    .slice(0, 5)
    .map((cycle) => {
      const pond = selectedPonds.get(cycle.pondId);
      return {
        pond: pond ? pondLabel(pond) : (cycle.pond?.code ?? cycle.pondId),
        quantity: cycle.plCount,
        geneticCode: cycle.geneticCode ?? '',
        supplier: cycle.larvaeSupplier ?? cycle.supplier,
      };
    });

  const totalQuantity = allocations.reduce((sum, row) => sum + (isTransferMode ? sumOriginQuantities(row.origins ?? []) : row.quantity), 0);
  const summary = getAllocationSummary(asAllocationRows(allocations), totalQuantity);
  const density = Number(form.density || 0);
  const bonusPct = form.bonusPct.trim() === '' ? null : Number(form.bonusPct);
  const plPerGram = Number(form.plPerGram || 0);
  const autoStageDay = calculateStageDay(form.stockDate, form.transferDate || null, todayIsoDate());
  const effectiveStageDay = form.stageDayOverride.trim() === '' ? autoStageDay : Number(form.stageDayOverride);

  function asAllocationRows(rows: AllocationRowState[]): AllocationRow[] {
    return rows.map((row) => ({
      pondId: row.pondId,
      quantity: isTransferMode ? sumOriginQuantities(row.origins ?? []) : row.quantity,
    }));
  }

  const validation = validateAllocationRows(asAllocationRows(allocations), totalQuantity || 1);

  function toggleTank(pondId: string) {
    setSelectedTankIds((current) => {
      const next = new Set(current);
      if (next.has(pondId)) next.delete(pondId);
      else next.add(pondId);
      return next;
    });
  }

  function createRowsForSelection() {
    if (selectedTankIds.size === 0) {
      setError('Selecione ao menos um tanque.');
      return;
    }
    setAllocations((current) => {
      const currentByPond = new Map(current.map((row) => [row.pondId, row]));
      return Array.from(selectedTankIds).map((pondId) => currentByPond.get(pondId) ?? makeRow(pondId));
    });
    setError(null);
  }

  function switchMode(nextMode: StockingMode) {
    if (allocations.length > 0 && !window.confirm('Trocar de modo vai limpar a distribuição atual. Continuar?')) return;
    setMode(nextMode);
    setAllocations([]);
    setSelectedTankIds(new Set());
  }

  function switchSubMode(next: ViveiroSubMode) {
    if (allocations.length > 0 && !window.confirm('Trocar o tipo de povoamento vai limpar a distribuição atual. Continuar?')) return;
    setViveiroSubMode(next);
    setAllocations([]);
    if (next === 'TRANSFERENCIA') {
      setForm((current) => ({ ...current, supplier: '', geneticCode: '' }));
    }
  }

  function updateRow(id: string, patch: Partial<AllocationRowState>) {
    setAllocations((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  // Viveiro Direto ainda usa a meta área × densidade como sugestão, igual ao fluxo antigo.
  const directoSuggestions = useMemo(() => {
    if (mode !== 'VIVEIRO' || viveiroSubMode !== 'DIRETO' || !Number.isFinite(density) || density <= 0) {
      return new Map<string, ReturnType<typeof calculatePovoamentoQuantity>>();
    }
    const map = new Map<string, ReturnType<typeof calculatePovoamentoQuantity>>();
    allocations.forEach((row) => {
      const pond = selectedPonds.get(row.pondId);
      if (pond) map.set(row.id, calculatePovoamentoQuantity(pond.areaHa, density, bonusPct));
    });
    return map;
  }, [mode, viveiroSubMode, density, bonusPct, allocations, selectedPonds]);

  async function handleSave() {
    setError(null);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    if (!form.supplier.trim() && !isTransferMode) {
      setError('Informe o fornecedor.');
      return;
    }

    const sampleCount = Number(form.sampleCount || 0);
    if (isTransferMode) {
      const transferBiometryValidation = validateTransferBiometry(plPerGram, sampleCount);
      if (!transferBiometryValidation.valid) {
        setError(transferBiometryValidation.message);
        return;
      }
    }

    try {
      // RF-13: plPerGram informed on a transfer is never dropped — it goes onto
      // the destination cycle (plPerGram below, same as direct stocking) and,
      // separately, onto a closing biometria for every berçário it drew from.
      const originCycleIds = isTransferMode ? collectTransferOriginCycleIds(allocations) : [];

      await Promise.all([
        ...allocations.map((row) => {
          const pond = selectedPonds.get(row.pondId);
          if (!pond) throw new Error('Selecione um tanque válido.');

          const rowQuantity = isTransferMode ? sumOriginQuantities(row.origins ?? []) : row.quantity;

          return createCycle.mutateAsync({
            pondId: row.pondId,
            supplier: form.supplier.trim() || 'Transferência interna',
            stockDate: form.stockDate,
            plCount: rowQuantity,
            initialPhase: getCyclePhaseForPondType(pond.type),
            larvaeSupplier: form.supplier.trim() || undefined,
            geneticCode: isTransferMode ? undefined : (form.geneticCode.trim() || undefined),
            larvaeLotCode: form.lotCode.trim() || undefined,
            larvaeStage: 'PL',
            stageDay: Number.isFinite(effectiveStageDay) && effectiveStageDay > 0 ? effectiveStageDay : undefined,
            transferDate: form.transferDate || undefined,
            plPerGram: plPerGram > 0 ? plPerGram : undefined,
            origins: isTransferMode
              ? (row.origins ?? []).filter((origin) => origin.quantity > 0)
              : undefined,
          });
        }),
        ...(isTransferMode && plPerGram > 0
          ? originCycleIds.map((originCycleId) =>
              createBiometric.mutateAsync({
                cycleId: originCycleId,
                measuredAt: form.stockDate,
                sampleCount,
                averageWeightG: plPerGramToAverageWeightG(plPerGram),
                responsibleId: user?.id,
              }),
            )
          : []),
      ]);

      // useCreateCycle já invalida a query ['cycles'] no onSuccess, então
      // recentPovoamentos (useCycles acima) revalida sozinho — sem estado local.
      setForm((current) => ({
        ...current,
        lotCode: '',
        biometria: '',
        stageDayOverride: '',
        transferDate: '',
        plPerGram: '',
        sampleCount: '',
        stockDate: todayIsoDate(),
      }));
      setAllocations([]);
      setSelectedTankIds(new Set());
    } catch (saveError: unknown) {
      const errorMessage = typeof saveError === 'object' && saveError !== null && 'response' in saveError
        ? (saveError as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const fallbackMessage = saveError instanceof Error ? saveError.message : undefined;
      setError(errorMessage ?? fallbackMessage ?? 'Erro ao salvar o povoamento.');
    }
  }

  const pondOptions = ponds
    .filter((pond) => targetPondTypesForMode(mode).includes(pond.type as StockingPondType))
    .map((pond) => ({ value: pond.id, label: `${pond.code} · ${pond.name}` }));

  const tankCards = targetPondTypesForMode(mode).map((type) => ({
    type,
    label: getPondTypeShortLabel(type),
    title: getPondTypeLabel(type),
    ponds: targetPonds.filter((pond) => pond.type === type),
  }));

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Povoamento</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
              Berçário recebe larva da larvicultura. Viveiro recebe direto ou por transferência de berçário.
            </div>
          </div>
          <div style={{ minWidth: 170 }}>
            <Input label="Data do povoamento" type="date" value={form.stockDate} onChange={(e) => setForm((current) => ({ ...current, stockDate: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: space.inline, marginTop: space.section }}>
          <Button variant={mode === 'BERCARIO' ? 'primary' : 'secondary'} onClick={() => switchMode('BERCARIO')}>
            Berçário
          </Button>
          <Button variant={mode === 'VIVEIRO' ? 'primary' : 'secondary'} onClick={() => switchMode('VIVEIRO')}>
            Viveiro
          </Button>
        </div>

        {mode === 'VIVEIRO' && (
          <div style={{ display: 'flex', gap: space.inline, marginTop: space.tile }}>
            <Button size="sm" variant={viveiroSubMode === 'DIRETO' ? 'primary' : 'secondary'} onClick={() => switchSubMode('DIRETO')}>
              Povoamento direto
            </Button>
            <Button size="sm" variant={viveiroSubMode === 'TRANSFERENCIA' ? 'primary' : 'secondary'} onClick={() => switchSubMode('TRANSFERENCIA')}>
              Transferência de berçário
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline, marginTop: space.section }}>
          {[
            { to: '/dashboard', label: 'Voltar ao painel' },
            { to: '/tanques', label: 'Viveiros' },
            { to: '/nutrition', label: 'Ração' },
            { to: '/biometrias', label: 'Biometrias' },
          ].map((item) => (
            <Link key={item.to} to={item.to} style={workspaceLink}>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <StatCard label="Tanques aptos" value={isLoading ? '-' : targetPonds.length} />
          <StatCard label="Larvas alocadas" value={`${fmt(summary.allocated, 0)}`} />
          <StatCard label="Tanques selecionados" value={selectedTankIds.size} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)', gap: space.page, alignItems: 'start' }}>
        <div style={workspaceCard}>
          {!isTransferMode && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Código genético"
                value={form.geneticCode}
                onChange={(e) => setForm((current) => ({ ...current, geneticCode: e.target.value }))}
                placeholder="Linhagem informada pela larvicultura"
              />
              <Input label="Fornecedor" value={form.supplier} onChange={(e) => setForm((current) => ({ ...current, supplier: e.target.value }))} />
              <Input label="Lote / código" value={form.lotCode} onChange={(e) => setForm((current) => ({ ...current, lotCode: e.target.value }))} />
              <Input
                label="Dia do estágio"
                type="number"
                min={1}
                step="1"
                placeholder={String(autoStageDay)}
                value={form.stageDayOverride}
                onChange={(e) => setForm((current) => ({ ...current, stageDayOverride: e.target.value }))}
              />
              <Input
                label="PL/grama opcional"
                type="number"
                min={0}
                step="1"
                placeholder="Pós-larvas por grama"
                value={form.plPerGram}
                onChange={(e) => setForm((current) => ({ ...current, plPerGram: e.target.value }))}
              />
              {mode === 'VIVEIRO' && (
                <Input
                  label="Densidade (PL/m²) opcional"
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.density}
                  onChange={(e) => setForm((current) => ({ ...current, density: e.target.value }))}
                />
              )}
            </div>
          )}

          {isTransferMode && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Densidade (PL/m²) opcional"
                type="number"
                min={0}
                step="0.1"
                value={form.density}
                onChange={(e) => setForm((current) => ({ ...current, density: e.target.value }))}
              />
              <Input
                label="Lote / código opcional"
                value={form.lotCode}
                onChange={(e) => setForm((current) => ({ ...current, lotCode: e.target.value }))}
              />
              <Input
                label="PL/grama opcional"
                type="number"
                min={0}
                step="1"
                placeholder="Pós-larvas por grama"
                value={form.plPerGram}
                onChange={(e) => setForm((current) => ({ ...current, plPerGram: e.target.value }))}
              />
              <Input
                label={plPerGram > 0 ? 'Amostras (obrigatório com PL/grama)' : 'Amostras opcional'}
                type="number"
                min={0}
                step="1"
                placeholder="Ex: 15"
                value={form.sampleCount}
                onChange={(e) => setForm((current) => ({ ...current, sampleCount: e.target.value }))}
              />
            </div>
          )}

          {isTransferMode && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              Fornecedor registrado automaticamente como "Transferência interna".
              {plPerGram > 0 && ' O PL/grama informado vira uma biometria de fechamento no berçário de origem.'}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: space.section, marginTop: space.section }}>
            <h3 style={sectionTitle}>{mode === 'BERCARIO' ? 'Berçários' : 'Viveiros'} disponíveis</h3>
            <div style={{ ...sectionSubtitle, marginTop: 2, marginBottom: space.tile }}>
              Selecione um ou mais tanques e clique em "Criar povoamento".
            </div>
            <SelectablePondChips ponds={targetPonds} selectedIds={selectedTankIds} onToggle={toggleTank} />
            <div style={{ marginTop: space.tile }}>
              <Button variant="secondary" onClick={createRowsForSelection} disabled={selectedTankIds.size === 0}>
                Criar povoamento ({selectedTankIds.size})
              </Button>
            </div>
          </div>

          {allocations.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: space.section, marginTop: space.section }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space.tile, flexWrap: 'wrap', marginBottom: space.tile }}>
                <div>
                  <h3 style={sectionTitle}>Distribuição</h3>
                  <div style={{ ...sectionSubtitle, marginTop: 2 }}>Ajuste cada tanque antes de salvar.</div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Total: <strong style={{ color: 'var(--text-primary)' }}>{fmt(summary.allocated, 0)}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: space.section }}>
                {allocations.map((row) => {
                  const pond = selectedPonds.get(row.pondId);
                  const suggestion = directoSuggestions.get(row.id);
                  return (
                    <div key={row.id} style={{ ...workspaceTile, padding: 14, display: 'grid', gap: space.inline }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space.inline }}>
                        <SearchableSelect
                          label="Tanque"
                          options={pondOptions}
                          placeholder="Selecione"
                          value={row.pondId}
                          onChange={(newValue) => {
                            setSelectedTankIds((current) => {
                              const next = new Set(current);
                              next.delete(row.pondId);
                              next.add(newValue);
                              return next;
                            });
                            updateRow(row.id, { pondId: newValue });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setAllocations((current) => current.filter((r) => r.id !== row.id))}
                          style={{ height: controlHeight, borderRadius: radius.control, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
                          aria-label={`Remover ${pond?.code ?? 'tanque'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {!isTransferMode && (
                        <QuantityWeightInput
                          quantity={row.quantity}
                          weightG={row.weightG ?? 0}
                          plPerGram={plPerGram}
                          onChange={({ quantity, weightG }) => updateRow(row.id, { quantity, weightG })}
                        />
                      )}

                      {!isTransferMode && suggestion && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          Sugerido por área×densidade: {fmt(suggestion.totalLarvae, 0)} PL
                        </div>
                      )}

                      {isTransferMode && (
                        <OriginPicker
                          options={originOptions}
                          value={row.origins ?? []}
                          onChange={(origins) => updateRow(row.id, { origins })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: space.section, display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ color: validation.valid ? 'var(--text-muted)' : 'var(--danger)', fontSize: 13 }}>
                  {validation.valid ? 'Pronto para salvar.' : validation.message}
                </div>
                <div style={{ display: 'flex', gap: space.inline }}>
                  <Button variant="secondary" icon={<ArrowRightLeft size={16} />} onClick={() => setAllocations([])}>
                    Limpar distribuição
                  </Button>
                  <Button loading={createCycle.isPending} onClick={handleSave} disabled={!validation.valid}>
                    Salvar povoamento
                  </Button>
                </div>
              </div>

              {error && <div style={{ marginTop: 10, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            </div>
          )}

          <details style={{ marginTop: space.section, borderTop: '1px solid var(--border)', paddingTop: space.tile }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Detalhes opcionais</summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: space.tile }}>
              <Input label="Biometria opcional" type="number" min={0} step="0.01" value={form.biometria} onChange={(e) => setForm((current) => ({ ...current, biometria: e.target.value }))} />
              <Input label="Transferência prevista opcional" type="date" value={form.transferDate} onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              Estágio calculado automaticamente: dia {autoStageDay} desde o povoamento{form.transferDate ? ' (limitado pela transferência prevista)' : ''}.
            </div>
          </details>
        </div>

        <div style={{ display: 'grid', gap: space.page, alignContent: 'start' }}>
          <div style={workspaceCard}>
            <h2 style={sectionTitle}>{mode === 'BERCARIO' ? 'Berçários' : 'Viveiros'} — visão geral</h2>
            <div style={{ display: 'grid', gap: space.tile }}>
              {tankCards.map((card) => (
                <div key={card.type} style={{ ...workspaceTile, padding: 14 }}>
                  <div style={workspaceTileLabel}>{card.label}</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{card.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{card.ponds.length} tanque(s)</div>
                </div>
              ))}
            </div>
          </div>

          <div style={workspaceCard}>
            <h2 style={sectionTitle}>Últimos povoamentos salvos</h2>
            <div style={{ display: 'grid', gap: space.inline }}>
              {recentPovoamentos.length ? recentPovoamentos.map((item, index) => (
                <div key={`${item.pond}-${index}`} style={{ ...workspaceTile, padding: 12 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.pond}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    {item.geneticCode || 'Sem código genético'} · {item.supplier} · {fmt(item.quantity, 0)} PL
                  </div>
                </div>
              )) : (
                <EmptyState
                  compact
                  title="Nenhum povoamento salvo ainda."
                  description="Selecione os tanques e clique em Criar povoamento para começar."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: 'ok' | 'danger' }) {
  // The distribution tile is the one the operator watches while allocating, so
  // it turns red the moment the sum passes the lot.
  const toneStyle =
    tone === 'danger'
      ? { backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }
      : tone === 'ok'
        ? { backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-soft-strong)' }
        : {};

  return (
    <div style={{ ...workspaceTile, ...toneStyle }}>
      <div style={workspaceTileLabel}>{label}</div>
      <div
        style={{
          ...workspaceTileValue,
          color: tone === 'danger' ? 'var(--danger)' : tone === 'ok' ? 'var(--accent-dark)' : 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
