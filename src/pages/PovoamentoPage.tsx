import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useCreateCycle } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
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
  workspaceTileDetail,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import {
  calculatePovoamentoQuantity,
  calculateStageDay,
  getAllocationSummary,
  getCyclePhaseForPondType,
  PovoamentoTankTypeLabels,
  validateAllocationRows,
  type AllocationRow,
} from './povoamento';

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
  stockDate: string;
};

type AllocationRowState = AllocationRow & { id: string };

function makeRow(pondId = ''): AllocationRowState {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, pondId, quantity: 0, weightG: 0 };
}

function asAllocationRows(rows: AllocationRowState[]): AllocationRow[] {
  return rows.map((row) => ({ pondId: row.pondId, quantity: row.quantity }));
}

function typeLabel(type: PondType) {
  if (type === PondType.PRE_BERCARIO) return 'Pré-berçário';
  if (type === PondType.BERCARIO) return 'Berçário';
  return 'Engorda';
}

function pondLabel(pond: Pond) {
  return `${pond.code} · ${pond.name}`;
}

export function PovoamentoPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const createCycle = useCreateCycle();
  const [error, setError] = useState<string | null>(null);
  const [savedLots, setSavedLots] = useState<Array<{ pond: string; quantity: number; geneticCode: string; supplier: string }>>([]);
  const [form, setForm] = useState<PovoamentoForm>({
    geneticCode: '',
    supplier: '',
    lotCode: '',
    density: '',
    bonusPct: '',
    totalQuantity: '',
    biometria: '',
    stageDayOverride: '',
    transferDate: '',
    plPerGram: '',
    stockDate: todayIsoDate(),
  });
  const [allocations, setAllocations] = useState<AllocationRowState[]>([makeRow()]);

  const availablePonds = useMemo(
    () => ponds.filter((pond) => ALLOWED_POND_TYPES.includes(pond.type as AllowedPondType)),
    [ponds],
  );

  const totalQuantity = Number(form.totalQuantity || 0);
  const summary = getAllocationSummary(asAllocationRows(allocations), totalQuantity);
  const validation = validateAllocationRows(asAllocationRows(allocations), totalQuantity);
  const selectedPonds = new Map(availablePonds.map((pond) => [pond.id, pond]));
  const density = Number(form.density || 0);
  const bonusPct = form.bonusPct.trim() === '' ? null : Number(form.bonusPct);
  const autoStageDay = calculateStageDay(form.stockDate, form.transferDate || null, todayIsoDate());
  const effectiveStageDay = form.stageDayOverride.trim() === '' ? autoStageDay : Number(form.stageDayOverride);
  const hasBonus = bonusPct !== null && Number.isFinite(bonusPct) && bonusPct > 0;

  const allocationCalculations = useMemo(() => {
    return allocations.map((allocation) => {
      const pond = selectedPonds.get(allocation.pondId);
      if (!pond || !Number.isFinite(density) || density <= 0) {
        return { allocationId: allocation.id, pond, calculation: null };
      }

      return {
        allocationId: allocation.id,
        pond,
        calculation: calculatePovoamentoQuantity(pond.areaHa, density, bonusPct),
      };
    });
  }, [allocations, bonusPct, density, selectedPonds]);

  const calculationSummary = allocationCalculations.reduce(
    (acc, item) => {
      if (!item.calculation) return acc;
      return {
        areaHa: acc.areaHa + (item.pond?.areaHa ?? 0),
        baseLarvae: acc.baseLarvae + item.calculation.baseLarvae,
        bonusLarvae: acc.bonusLarvae + item.calculation.bonusLarvae,
        totalLarvae: acc.totalLarvae + item.calculation.totalLarvae,
      };
    },
    { areaHa: 0, baseLarvae: 0, bonusLarvae: 0, totalLarvae: 0 },
  );

  // Autofill: viveiro selecionado + densidade -> quantidade = área do viveiro (m²) * densidade (+ bônus).
  const pondIdsKey = allocations.map((allocation) => allocation.pondId).join('|');
  useEffect(() => {
    if (!Number.isFinite(density) || density <= 0) return;

    setAllocations((current) =>
      current.map((allocation) => {
        const pond = selectedPonds.get(allocation.pondId);
        if (!pond) return allocation;
        const calc = calculatePovoamentoQuantity(pond.areaHa, density, bonusPct);
        return { ...allocation, quantity: calc.totalLarvae };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pondIdsKey, density, bonusPct]);

  useEffect(() => {
    if (!Number.isFinite(density) || density <= 0) return;
    const calculatedTotal = allocations.reduce((sum, allocation) => {
      const pond = selectedPonds.get(allocation.pondId);
      if (!pond) return sum;
      return sum + calculatePovoamentoQuantity(pond.areaHa, density, bonusPct).totalLarvae;
    }, 0);
    if (calculatedTotal > 0) {
      setForm((current) => ({ ...current, totalQuantity: String(calculatedTotal) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pondIdsKey, density, bonusPct]);

  const pondOptions = availablePonds.map((pond) => ({
    value: pond.id,
    label: `${pond.code} · ${pond.name}`,
  }));

  const cards = ALLOWED_POND_TYPES.map((type) => {
    const rows = availablePonds.filter((pond) => pond.type === type);
    const activeCount = rows.filter((pond) => pond.status === 'POVOADO' || pond.status === 'DESPESCANDO').length;

    return {
      type,
      label: PovoamentoTankTypeLabels[type],
      title: typeLabel(type),
      count: rows.length,
      activeCount,
      ponds: rows,
    };
  });

  function applyCalculatedDistribution() {
    if (!Number.isFinite(density) || density <= 0) {
      setError('Informe a densidade de povoamento.');
      return;
    }

    const updatedAllocations = allocations.map((allocation) => {
      const pond = selectedPonds.get(allocation.pondId);
      if (!pond) return allocation;
      const calculation = calculatePovoamentoQuantity(pond.areaHa, density, bonusPct);
      return { ...allocation, quantity: calculation.totalLarvae };
    });

    const calculatedTotal = updatedAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
    setAllocations(updatedAllocations);
    setForm((current) => ({ ...current, totalQuantity: String(calculatedTotal) }));
    setError(null);
  }

  async function handleSave() {
    setError(null);
    const result = validateAllocationRows(asAllocationRows(allocations), totalQuantity);
    if (!result.valid) {
      setError(result.message);
      return;
    }

    if (!form.supplier.trim()) {
      setError('Informe o fornecedor.');
      return;
    }

    try {
      await Promise.all(
        allocations.map((allocation) => {
          const pond = selectedPonds.get(allocation.pondId);
          if (!pond) {
            throw new Error('Selecione um viveiro válido.');
          }

          return createCycle.mutateAsync({
            pondId: allocation.pondId,
            supplier: form.supplier.trim(),
            stockDate: form.stockDate,
            plCount: allocation.quantity,
            initialPhase: getCyclePhaseForPondType(pond.type),
            larvaeSupplier: form.supplier.trim(),
            geneticCode: form.geneticCode.trim() || undefined,
            larvaeLotCode: form.lotCode.trim() || undefined,
            larvaeStage: 'PL',
            stageDay: Number.isFinite(effectiveStageDay) && effectiveStageDay > 0 ? effectiveStageDay : undefined,
            transferDate: form.transferDate || undefined,
            plPerGram: form.plPerGram.trim() !== '' && Number.isFinite(Number(form.plPerGram)) ? Number(form.plPerGram) : undefined,
          });
        }),
      );

      setSavedLots((current) => [
        ...allocations.map((allocation) => {
          const pond = selectedPonds.get(allocation.pondId);
          return {
            pond: pond ? pondLabel(pond) : allocation.pondId,
            quantity: allocation.quantity,
            geneticCode: form.geneticCode,
            supplier: form.supplier,
          };
        }),
        ...current,
      ]);

      setForm((current) => ({
        ...current,
        lotCode: '',
        totalQuantity: '',
        biometria: '',
        stageDayOverride: '',
        transferDate: '',
        plPerGram: '',
        stockDate: todayIsoDate(),
      }));
      setAllocations([makeRow(availablePonds[0]?.id ?? '')]);
    } catch (saveError: unknown) {
      const errorMessage = typeof saveError === 'object' && saveError !== null && 'response' in saveError
        ? (saveError as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const fallbackMessage = saveError instanceof Error ? saveError.message : undefined;
      setError(errorMessage ?? fallbackMessage ?? 'Erro ao salvar o povoamento.');
    }
  }

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Povoamento</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
              A soma das quantidades nunca pode passar do total informado.
            </div>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data do povoamento" type="date" value={form.stockDate} onChange={(e) => setForm((current) => ({ ...current, stockDate: e.target.value }))} />
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setAllocations((current) => [...current, makeRow(availablePonds[0]?.id ?? '')])}>
              Adicionar viveiro
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline, marginTop: space.section }}>
          {[
            { to: '/dashboard', label: 'Voltar ao painel' },
            { to: '/tanques', label: 'Viveiros' },
            { to: '/nutrition', label: 'Ração' },
            { to: '/biometrias', label: 'Biometrias' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={workspaceLink}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <StatCard label="Viveiros aptos" value={isLoading ? '-' : availablePonds.length} />
          <StatCard label="Larvas alocadas" value={`${fmt(summary.allocated, 0)}`} />
          <StatCard label="Larvas restantes" value={`${fmt(summary.remaining, 0)}`} />
          <StatCard
            label="Distribuição"
            value={summary.isOverallocated ? 'Excede o total' : 'Dentro do limite'}
            tone={summary.isOverallocated ? 'danger' : 'ok'}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)', gap: space.page, alignItems: 'start' }}>
        <div style={workspaceCard}>
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
              label="Densidade (PL/m²) opcional"
              type="number"
              min={0}
              step="0.1"
              value={form.density}
              onChange={(e) => setForm((current) => ({ ...current, density: e.target.value }))}
            />
            <Input
              label="Bônus (%) opcional"
              type="number"
              min={0}
              step="0.1"
              value={form.bonusPct}
              onChange={(e) => setForm((current) => ({ ...current, bonusPct: e.target.value }))}
            />
            <Input label="Quantidade total" type="number" min={0} step="1" value={form.totalQuantity} onChange={(e) => setForm((current) => ({ ...current, totalQuantity: e.target.value }))} />
            <Input label="Biometria opcional" type="number" min={0} step="0.01" value={form.biometria} onChange={(e) => setForm((current) => ({ ...current, biometria: e.target.value }))} />
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
              label="Transferência prevista"
              type="date"
              value={form.transferDate}
              onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))}
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
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
            Estágio calculado automaticamente: dia {autoStageDay} desde o povoamento{form.transferDate ? ' (limitado pela transferência prevista)' : ''}. Preencha "Dia do estágio" para sobrescrever.
          </div>

          <div style={{ ...workspaceTile, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h3 style={sectionTitle}>Cálculo do povoamento</h3>
                <div style={{ ...sectionSubtitle, marginTop: 2 }}>1 ha = 10.000 m². O bônus é aplicado só se preenchido.</div>
              </div>
              <Button variant="secondary" onClick={applyCalculatedDistribution} disabled={!Number.isFinite(density) || density <= 0}>
                Aplicar cálculo
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: space.inline, marginTop: space.section }}>
              <MiniCalc label="Área total" value={`${fmt(calculationSummary.areaHa, 2)} ha`} detail={`${fmt(calculationSummary.areaHa * 10000, 0)} m²`} />
              <MiniCalc label="Base" value={`${fmt(calculationSummary.baseLarvae, 0)} PL`} detail="sem bônus" />
              <MiniCalc label="Bônus" value={hasBonus ? `${fmt(calculationSummary.bonusLarvae, 0)} PL` : '0 PL'} detail={hasBonus ? `${fmt(bonusPct ?? 0, 1)}% aplicado` : 'opcional'} />
              <MiniCalc label="Total estimado" value={`${fmt(calculationSummary.totalLarvae, 0)} PL`} detail="resultado do cálculo" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: space.section }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space.tile, flexWrap: 'wrap', marginBottom: space.tile }}>
              <div>
                <h3 style={sectionTitle}>Distribuição por viveiro</h3>
                <div style={{ ...sectionSubtitle, marginTop: 2 }}>Ajuste as quantidades por viveiro antes de salvar.</div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Restante: <strong style={{ color: 'var(--text-primary)' }}>{fmt(summary.remaining, 0)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gap: space.tile }}>
              {allocations.map((allocation, index) => (
                <div key={allocation.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px 44px', gap: space.inline, alignItems: 'end' }}>
                  <SearchableSelect
                    label={`Viveiro ${index + 1}`}
                    options={pondOptions}
                    placeholder="Selecione"
                    value={allocation.pondId}
                    onChange={(newValue) => setAllocations((current) => current.map((row) => (row.id === allocation.id ? { ...row, pondId: newValue } : row)))}
                  />
                  <Input
                    label="Quantidade"
                    type="number"
                    min={0}
                    step="1"
                    value={allocation.quantity === 0 ? '' : allocation.quantity}
                      onChange={(e) => setAllocations((current) => current.map((row) => (row.id === allocation.id ? { ...row, quantity: Number(e.target.value || 0) } : row)))}
                  />
                  <button
                    type="button"
                    onClick={() => setAllocations((current) => current.filter((row) => row.id !== allocation.id))}
                    disabled={allocations.length === 1}
                    style={{
                      height: controlHeight,
                      borderRadius: radius.control,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      cursor: allocations.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                    aria-label={`Remover viveiro ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  {allocationCalculations[index]?.calculation && (
                    <div style={{ gridColumn: '1 / -1', marginTop: -4, color: 'var(--text-muted)', fontSize: 12 }}>
                      {allocationCalculations[index].pond?.code ?? 'Viveiro'}: área {fmt(allocationCalculations[index].calculation.areaM2 / 10000, 2)} ha · base {fmt(allocationCalculations[index].calculation.baseLarvae, 0)} PL
                      {hasBonus ? ` · bônus ${fmt(allocationCalculations[index].calculation.bonusLarvae, 0)} PL` : ''} · sugerido {fmt(allocationCalculations[index].calculation.totalLarvae, 0)} PL
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: space.section, display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ color: validation.valid ? 'var(--text-muted)' : 'var(--danger)', fontSize: 13 }}>
                {validation.valid ? 'Pronto para salvar.' : validation.message}
              </div>
              <div style={{ display: 'flex', gap: space.inline }}>
                <Button variant="secondary" icon={<ArrowRightLeft size={16} />} onClick={() => setAllocations([makeRow(availablePonds[0]?.id ?? '')])}>
                  Limpar distribuição
                </Button>
                <Button loading={createCycle.isPending} onClick={handleSave} disabled={!validation.valid || !form.supplier.trim()}>
                  Salvar povoamento
                </Button>
              </div>
            </div>

            {error && <div style={{ marginTop: 10, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: space.page, alignContent: 'start' }}>
          <div style={workspaceCard}>
            <h2 style={sectionTitle}>Viveiros disponíveis</h2>
            <div style={{ display: 'grid', gap: space.tile }}>
              {cards.map((card) => (
                <div key={card.type} style={{ ...workspaceTile, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, alignItems: 'center' }}>
                    <div>
                      <div style={workspaceTileLabel}>{card.label}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{card.title}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{card.count}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{card.activeCount} povoados</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <PondChips ponds={card.ponds} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={workspaceCard}>
            <h2 style={sectionTitle}>Últimos povoamentos salvos</h2>
            <div style={{ display: 'grid', gap: space.inline }}>
              {savedLots.length ? savedLots.map((item, index) => (
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
                  description="Preencha o lote e a distribuição ao lado para salvar o primeiro."
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

function MiniCalc({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ ...workspaceTile, backgroundColor: 'var(--bg-card)', padding: '12px 14px' }}>
      <div style={workspaceTileLabel}>{label}</div>
      <div style={{ ...workspaceTileValue, fontSize: 18 }}>{value}</div>
      <div style={workspaceTileDetail}>{detail}</div>
    </div>
  );
}
