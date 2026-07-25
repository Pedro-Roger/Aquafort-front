import type { CyclePhase, PondType } from '../types';

export interface AllocationRow {
  pondId: string;
  quantity: number;
}

export interface AllocationSummary {
  allocated: number;
  remaining: number;
  isOverallocated: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message: string | null;
}

export interface PovoamentoCalculation {
  areaM2: number;
  baseLarvae: number;
  bonusLarvae: number;
  totalLarvae: number;
}

export const PovoamentoTankTypeLabels: Record<Exclude<PondType, 'REPRODUTOR'>, string> = {
  PRE_BERCARIO: 'BRÇ',
  BERCARIO: 'PC',
  ENGORDA: 'VE',
};

export function getAllocationSummary(rows: AllocationRow[], totalQuantity: number): AllocationSummary {
  const allocated = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  return {
    allocated,
    remaining: Math.max(0, totalQuantity - allocated),
    isOverallocated: allocated > totalQuantity,
  };
}

export function validateAllocationRows(rows: AllocationRow[], totalQuantity: number): ValidationResult {
  if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
    return { valid: false, message: 'Informe a quantidade total do lote.' };
  }

  if (!rows.length) {
    return { valid: false, message: 'Adicione ao menos um viveiro para o povoamento.' };
  }

  if (rows.some((row) => !row.pondId)) {
    return { valid: false, message: 'Selecione um viveiro para cada linha de distribuição.' };
  }

  if (rows.some((row) => !Number.isFinite(row.quantity) || row.quantity <= 0)) {
    return { valid: false, message: 'Informe a quantidade de larvas em cada viveiro.' };
  }

  const summary = getAllocationSummary(rows, totalQuantity);
  if (summary.isOverallocated) {
    return { valid: false, message: 'A soma das larvas povoadas não pode ser maior do que o total do lote.' };
  }

  return { valid: true, message: null };
}

export function getCyclePhaseForPondType(type: PondType): CyclePhase {
  if (type === 'PRE_BERCARIO') return 'PREPARACAO';
  if (type === 'BERCARIO') return 'BERCARIO';
  return 'ENGORDA';
}

export function calculatePovoamentoQuantity(areaHa: number, densityPerM2: number, bonusPct?: number | null): PovoamentoCalculation {
  const normalizedAreaHa = Number.isFinite(areaHa) ? Math.max(0, areaHa) : 0;
  const normalizedDensity = Number.isFinite(densityPerM2) ? Math.max(0, densityPerM2) : 0;
  const normalizedBonus = Number.isFinite(bonusPct ?? Number.NaN) ? Math.max(0, bonusPct ?? 0) : 0;
  const areaM2 = normalizedAreaHa * 10000;
  const baseLarvae = areaM2 * normalizedDensity;
  const bonusLarvae = baseLarvae * (normalizedBonus / 100);
  const totalLarvae = Math.round(baseLarvae + bonusLarvae);

  return {
    areaM2,
    baseLarvae: Math.round(baseLarvae),
    bonusLarvae: Math.round(bonusLarvae),
    totalLarvae,
  };
}
