import type { CyclePhase, PondType } from '../types';

export interface AllocationRow {
  pondId: string;
  /** For transfer rows (origins present), callers must keep this equal to sumOriginQuantities(origins). */
  quantity: number;
  /** Grams weighed out — only meaningful when PL/grama links it to quantity. */
  weightG?: number;
  /** Present only for viveiro rows stocked by transfer from berçário(s). */
  origins?: OriginAllocation[];
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Day of stage, incrementing +1 per calendar day starting at 1 on the arrival
 * (stockDate) day, capped at the transfer-day count once a transferDate is set.
 */
export function calculateStageDay(stockDate: string, transferDate: string | null | undefined, referenceDate: string): number {
  const start = new Date(stockDate);
  const today = new Date(referenceDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) return 1;

  const elapsedDays = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
  let day = elapsedDays + 1;

  if (transferDate) {
    const transfer = new Date(transferDate);
    if (!Number.isNaN(transfer.getTime())) {
      const maxDay = Math.floor((transfer.getTime() - start.getTime()) / MS_PER_DAY) + 1;
      day = Math.min(day, maxDay);
    }
  }

  return Math.max(1, day);
}

export function weightFromQuantity(quantity: number, plPerGram: number): number {
  if (!Number.isFinite(plPerGram) || plPerGram <= 0) return 0;
  if (!Number.isFinite(quantity) || quantity < 0) return 0;
  return quantity / plPerGram;
}

export function quantityFromWeight(weightG: number, plPerGram: number): number {
  if (!Number.isFinite(plPerGram) || plPerGram <= 0) return 0;
  if (!Number.isFinite(weightG) || weightG < 0) return 0;
  return Math.round(weightG * plPerGram);
}

export interface OriginAllocation {
  sourceCycleId: string;
  label: string;
  quantity: number;
}

export function sumOriginQuantities(origins: OriginAllocation[]): number {
  return origins.reduce((sum, origin) => sum + (Number.isFinite(origin.quantity) ? origin.quantity : 0), 0);
}

/**
 * RF-13: every berçário drawn on by the transfer gets its own closing
 * biometria. A berçário picked in more than one destination row (split
 * across two viveiros) still gets exactly one — dedup by cycle id.
 */
export function collectTransferOriginCycleIds(rows: { origins?: OriginAllocation[] }[]): string[] {
  const ids = new Set<string>();
  rows.forEach((row) => {
    (row.origins ?? []).forEach((origin) => {
      if (origin.quantity > 0) ids.add(origin.sourceCycleId);
    });
  });
  return Array.from(ids);
}

export interface OriginBalance {
  remaining: number;
  isOverdrawn: boolean;
}

/**
 * Advisory only — the operator's headcount can legitimately beat what was
 * logged for a berçário, so a request above `remaining` is flagged, never
 * blocked.
 */
export function calculateOriginBalance(plCount: number, allocatedElsewhere: number, requested: number): OriginBalance {
  const remaining = plCount - allocatedElsewhere;
  return { remaining, isOverdrawn: requested > remaining };
}

/**
 * RF-14: the transfer form creates a real `biometrics` row (same DTO/contract
 * as the weekly launch), so it can't relax validation just because it's
 * triggered from a different screen — sampleCount is required whenever
 * plPerGram was informed for the transfer.
 */
export function validateTransferBiometry(plPerGram: number, sampleCount: number): ValidationResult {
  if (plPerGram > 0 && (!Number.isFinite(sampleCount) || sampleCount <= 0)) {
    return { valid: false, message: 'Informe as amostras usadas para medir o PL/grama da transferência.' };
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
