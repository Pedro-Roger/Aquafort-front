export interface ConsumptionReferenceRow {
  weightG: number;
  consumptionPct: number;
}

export interface BiometricsOperationalEstimateInput {
  averageWeightG: number;
  racaoConsumidaKg: number;
  plCount: number;
  reference?: ConsumptionReferenceRow[];
}

export interface BiometricsOperationalEstimate {
  weightG: number;
  consumptionPct: number | null;
  biomassKg: number | null;
  shrimpCount: number | null;
  survivalPct: number | null;
}

function clampWeight(weightG: number) {
  if (!Number.isFinite(weightG)) return 0;
  return Math.max(0, weightG);
}

function clampPct(pct: number) {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, pct);
}

export const DEFAULT_CONSUMPTION_REFERENCE: ConsumptionReferenceRow[] = Array.from({ length: 18 }, (_, index) => {
  const weightG = index + 1;
  return {
    weightG,
    consumptionPct: Math.max(1, 11 - weightG),
  };
});

export function normalizeConsumptionReference(reference: ConsumptionReferenceRow[]): ConsumptionReferenceRow[] {
  const byWeight = new Map<number, ConsumptionReferenceRow>();

  reference.forEach((row) => {
    const weightG = Math.round(clampWeight(row.weightG));
    if (weightG < 1 || weightG > 18) return;

    byWeight.set(weightG, {
      weightG,
      consumptionPct: clampPct(row.consumptionPct),
    });
  });

  return Array.from({ length: 18 }, (_, index) => {
    const weightG = index + 1;
    return byWeight.get(weightG) ?? DEFAULT_CONSUMPTION_REFERENCE[index];
  });
}

export function getConsumptionPctForWeight(weightG: number, reference: ConsumptionReferenceRow[] = DEFAULT_CONSUMPTION_REFERENCE) {
  if (!reference.length) return null;

  const normalizedWeight = Math.max(1, Math.min(18, Math.floor(clampWeight(weightG))));
  const row = [...reference]
    .map((item) => ({ weightG: Math.round(clampWeight(item.weightG)), consumptionPct: clampPct(item.consumptionPct) }))
    .filter((item) => item.weightG >= 1 && item.weightG <= 18)
    .sort((a, b) => a.weightG - b.weightG)
    .find((item) => item.weightG === normalizedWeight)
    ?? reference
      .slice()
      .sort((a, b) => a.weightG - b.weightG)
      .reduce((acc, item) => (item.weightG <= normalizedWeight ? item : acc), reference[0]);

  return row ? clampPct(row.consumptionPct) : null;
}

export function calculateBiometricsOperationalEstimate({
  averageWeightG,
  racaoConsumidaKg,
  plCount,
  reference = DEFAULT_CONSUMPTION_REFERENCE,
}: BiometricsOperationalEstimateInput): BiometricsOperationalEstimate {
  const weightG = clampWeight(averageWeightG);
  const feedKg = clampWeight(racaoConsumidaKg);
  const totalPL = clampWeight(plCount);

  const consumptionPct = getConsumptionPctForWeight(weightG, reference);
  if (!consumptionPct || consumptionPct <= 0 || weightG <= 0 || feedKg <= 0) {
    return {
      weightG,
      consumptionPct: consumptionPct ?? null,
      biomassKg: null,
      shrimpCount: null,
      survivalPct: null,
    };
  }

  const biomassKg = feedKg / (consumptionPct / 100);
  const shrimpCount = (biomassKg * 1000) / weightG;
  const survivalPct = totalPL > 0 ? (shrimpCount / totalPL) * 100 : null;

  return {
    weightG,
    consumptionPct,
    biomassKg: Number(biomassKg.toFixed(2)),
    shrimpCount: Number(shrimpCount.toFixed(2)),
    survivalPct: survivalPct == null ? null : Number(survivalPct.toFixed(2)),
  };
}
