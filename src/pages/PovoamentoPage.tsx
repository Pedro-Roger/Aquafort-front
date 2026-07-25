import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCreateCycle } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
import type { Pond } from '../types';
import { PondType } from '../types';
import { workspaceSurface } from '../components/ui/surfaces';
import {
  calculatePovoamentoQuantity,
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

const ALLOWED_POND_TYPES = [PondType.PRE_BERCARIO, PondType.BERCARIO, PondType.ENGORDA] as const;
type AllowedPondType = (typeof ALLOWED_POND_TYPES)[number];
const STAGE_OPTIONS = [
  { value: 'PL', label: 'PL' },
  { value: 'PL_GRAMA', label: 'PL grama' },
];

type PovoamentoForm = {
  species: string;
  supplier: string;
  lotCode: string;
  density: string;
  bonusPct: string;
  totalQuantity: string;
  biometria: string;
  stage: 'PL' | 'PL_GRAMA';
  stockDate: string;
};

type AllocationRowState = AllocationRow & { id: string };

function makeRow(pondId = '', quantity = ''): AllocationRowState {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pondId,
    quantity: quantity === '' ? 0 : Number(quantity),
  };
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
  const [savedLots, setSavedLots] = useState<Array<{ pond: string; quantity: number; species: string; supplier: string }>>([]);
  const [form, setForm] = useState<PovoamentoForm>({
    species: 'Litopenaeus vannamei',
    supplier: '',
    lotCode: '',
    density: '',
    bonusPct: '',
    totalQuantity: '',
    biometria: '',
    stage: 'PL',
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
            throw new Error('Selecione um tanque válido.');
          }

          return createCycle.mutateAsync({
            pondId: allocation.pondId,
            supplier: form.supplier.trim(),
            stockDate: form.stockDate,
            plCount: allocation.quantity,
            initialPhase: getCyclePhaseForPondType(pond.type),
            larvaeSupplier: form.species.trim(),
            larvaeLotCode: form.lotCode.trim() || undefined,
            larvaeStage: form.stage === 'PL_GRAMA' ? 'PL grama' : 'PL',
          });
        }),
      );

      setSavedLots((current) => [
        ...allocations.map((allocation) => {
          const pond = selectedPonds.get(allocation.pondId);
          return {
            pond: pond ? pondLabel(pond) : allocation.pondId,
            quantity: allocation.quantity,
            species: form.species,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div
        style={{
          ...workspaceSurface,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>Povoamento</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Distribua um lote de larvas entre vários tanques.</h1>
            <p style={{ marginTop: 10, color: 'var(--text-muted)', maxWidth: 760 }}>
              Você pode transferir o mesmo lote entre tanques diferentes. A soma das quantidades nunca pode passar do total informado.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 170 }}>
              <Input label="Data do povoamento" type="date" value={form.stockDate} onChange={(e) => setForm((current) => ({ ...current, stockDate: e.target.value }))} />
            </div>
            <Button size="lg" icon={<Plus size={16} />} onClick={() => setAllocations((current) => [...current, makeRow(availablePonds[0]?.id ?? '')])} style={{ backgroundColor: '#fff', color: '#0f172a', boxShadow: 'none' }}>
              Adicionar tanque
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {[
            { to: '/dashboard', label: 'Voltar ao painel' },
            { to: '/tanques', label: 'Viveiros' },
            { to: '/nutrition', label: 'Ração' },
            { to: '/biometrias', label: 'Biometrias' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          <StatCard label="Tanques aptos" value={isLoading ? '-' : availablePonds.length} />
          <StatCard label="Larvas alocadas" value={`${fmt(summary.allocated, 0)}`} />
          <StatCard label="Larvas restantes" value={`${fmt(summary.remaining, 0)}`} />
          <StatCard label="Distribuição" value={summary.isOverallocated ? 'Excede o total' : 'Dentro do limite'} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)', gap: 16, minHeight: 0, flex: 1 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Espécie" value={form.species} onChange={(e) => setForm((current) => ({ ...current, species: e.target.value }))} />
            <Input label="Fornecedor" value={form.supplier} onChange={(e) => setForm((current) => ({ ...current, supplier: e.target.value }))} />
            <Input label="Lote / código" value={form.lotCode} onChange={(e) => setForm((current) => ({ ...current, lotCode: e.target.value }))} />
            <Input
              label="Densidade (PL/m²)"
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
            <Input label="Biometria" type="number" min={0} step="0.01" value={form.biometria} onChange={(e) => setForm((current) => ({ ...current, biometria: e.target.value }))} />
            <Select label="Estágio" options={STAGE_OPTIONS} value={form.stage} onChange={(e) => setForm((current) => ({ ...current, stage: e.target.value as PovoamentoForm['stage'] }))} />
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,245,251,0.96))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Cálculo do povoamento</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>1 ha = 10.000 m². O bônus é aplicado só se preenchido.</div>
              </div>
              <Button variant="secondary" onClick={applyCalculatedDistribution} disabled={!Number.isFinite(density) || density <= 0}>
                Aplicar cálculo
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
              <MiniCalc label="Área total" value={`${fmt(calculationSummary.areaHa, 2)} ha`} detail={`${fmt(calculationSummary.areaHa * 10000, 0)} m²`} />
              <MiniCalc label="Base" value={`${fmt(calculationSummary.baseLarvae, 0)} PL`} detail="sem bônus" />
              <MiniCalc label="Bônus" value={hasBonus ? `${fmt(calculationSummary.bonusLarvae, 0)} PL` : '0 PL'} detail={hasBonus ? `${fmt(bonusPct ?? 0, 1)}% aplicado` : 'opcional'} />
              <MiniCalc label="Total estimado" value={`${fmt(calculationSummary.totalLarvae, 0)} PL`} detail="resultado do cálculo" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Distribuição por tanque</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ajuste as quantidades por tanque antes de salvar.</div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Restante: <strong style={{ color: 'var(--text-primary)' }}>{fmt(summary.remaining, 0)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {allocations.map((allocation, index) => (
                <div key={allocation.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px 44px', gap: 10, alignItems: 'end' }}>
                  <Select
                    label={`Tanque ${index + 1}`}
                    options={pondOptions}
                    placeholder="Selecione"
                    value={allocation.pondId}
                    onChange={(e) => setAllocations((current) => current.map((row) => (row.id === allocation.id ? { ...row, pondId: e.target.value } : row)))}
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
                      height: 42,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      cursor: allocations.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                    aria-label={`Remover tanque ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  {allocationCalculations[index]?.calculation && (
                    <div style={{ gridColumn: '1 / -1', marginTop: -4, color: 'var(--text-muted)', fontSize: 12 }}>
                      {allocationCalculations[index].pond?.code ?? 'Tanque'}: área {fmt(allocationCalculations[index].calculation.areaM2 / 10000, 2)} ha · base {fmt(allocationCalculations[index].calculation.baseLarvae, 0)} PL
                      {hasBonus ? ` · bônus ${fmt(allocationCalculations[index].calculation.bonusLarvae, 0)} PL` : ''} · sugerido {fmt(allocationCalculations[index].calculation.totalLarvae, 0)} PL
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ color: validation.valid ? 'var(--text-muted)' : 'var(--danger)', fontSize: 13 }}>
                {validation.valid ? 'Pronto para salvar.' : validation.message}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
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

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Tanques disponíveis</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {cards.map((card) => (
                <div key={card.type} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14, backgroundColor: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{card.title}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{card.count}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{card.activeCount} povoados</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {card.ponds.slice(0, 4).map((pond) => (
                      <span key={pond.id} style={{ padding: '5px 10px', borderRadius: 999, backgroundColor: '#fff', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12 }}>
                        {pond.code}
                      </span>
                    ))}
                    {card.ponds.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem tanques cadastrados.</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Últimos povoamentos salvos</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {savedLots.length ? savedLots.map((item, index) => (
                <div key={`${item.pond}-${index}`} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 12, backgroundColor: 'var(--bg-elevated)' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.pond}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    {item.species} · {item.supplier} · {fmt(item.quantity, 0)} PL
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum povoamento salvo ainda.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ borderRadius: 18, padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function MiniCalc({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ borderRadius: 14, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginTop: 6 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{detail}</div>
    </div>
  );
}
