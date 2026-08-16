import { PondType } from '../types';

/**
 * RN-09: PL/grama and average individual weight are exact inverses.
 * `pl_por_grama = 1 / avg_weight_g` and `avg_weight_g = 1 / pl_por_grama`.
 * Reference (Pedro, campo real): 800.000 PLs a 250 PL/g = 3.200 g de biomassa
 * total; peso individual = 3.200 / 800.000 = 0,004 g = 1/250 — confere.
 */
export function plPerGramToAverageWeightG(plPerGram: number): number {
  if (!Number.isFinite(plPerGram) || plPerGram <= 0) return 0;
  return 1 / plPerGram;
}

export function averageWeightGToPlPerGram(averageWeightG: number): number {
  if (!Number.isFinite(averageWeightG) || averageWeightG <= 0) return 0;
  return 1 / averageWeightG;
}

/**
 * RN-10: the unit biometry is entered in depends on `pond.type` of the
 * cycle's viveiro. Only `bercario` (VB) enters as PL/g — `engorda` and
 * `reprodutor` (VE) keep grams, unchanged.
 */
export function isBercarioPondType(pondType?: PondType | string | null): boolean {
  return pondType === PondType.BERCARIO;
}
