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

/**
 * The table spans a whole cycle: post-larvae leaving the nursery around 0.1 g
 * eat close to 15% of their own weight per day, and that share falls as they
 * grow, down to 2% at harvest weight.
 */
export const DEFAULT_CONSUMPTION_REFERENCE: ConsumptionReferenceRow[] = [
  { weightG: 0.1, consumptionPct: 15 },
  { weightG: 0.5, consumptionPct: 12 },
  { weightG: 1, consumptionPct: 10 },
  { weightG: 2, consumptionPct: 8.5 },
  { weightG: 3, consumptionPct: 7 },
  { weightG: 4, consumptionPct: 6.2 },
  { weightG: 5, consumptionPct: 5.5 },
  { weightG: 6, consumptionPct: 5 },
  { weightG: 7, consumptionPct: 4.7 },
  { weightG: 8, consumptionPct: 4.5 },
  { weightG: 9, consumptionPct: 4.2 },
  { weightG: 10, consumptionPct: 4 },
  { weightG: 11, consumptionPct: 3.8 },
  { weightG: 12, consumptionPct: 3.5 },
  { weightG: 13, consumptionPct: 3.3 },
  { weightG: 14, consumptionPct: 3.2 },
  { weightG: 15, consumptionPct: 3.1 },
  { weightG: 16, consumptionPct: 3 },
  { weightG: 17, consumptionPct: 2.8 },
  { weightG: 18, consumptionPct: 2.6 },
  { weightG: 19, consumptionPct: 2.4 },
  { weightG: 20, consumptionPct: 2.2 },
  { weightG: 21, consumptionPct: 2 },
  { weightG: 22, consumptionPct: 2 },
];

function roundWeight(weightG: number) {
  return Number(clampWeight(weightG).toFixed(1));
}

/** Weights the default table covers; rows past them are farm additions. */
export const DEFAULT_REFERENCE_WEIGHTS = new Set(DEFAULT_CONSUMPTION_REFERENCE.map((row) => row.weightG));

export function normalizeConsumptionReference(reference: ConsumptionReferenceRow[]): ConsumptionReferenceRow[] {
  const byWeight = new Map<number, ConsumptionReferenceRow>();

  // The default table is the floor: the base range is always covered. The
  // farm's own rows win over it and may go past the last default weight —
  // the table is open-ended upward (23 g, 24 g, 25 g, ...).
  DEFAULT_CONSUMPTION_REFERENCE.forEach((row) => byWeight.set(row.weightG, row));

  reference.forEach((row) => {
    const weightG = roundWeight(row.weightG);
    if (weightG <= 0) return;

    byWeight.set(weightG, {
      weightG,
      consumptionPct: clampPct(row.consumptionPct),
    });
  });

  return Array.from(byWeight.values()).sort((a, b) => a.weightG - b.weightG);
}

/**
 * Reads the table as a step: a shrimp uses the rate of the heaviest row it has
 * already reached. Weights past either end clamp to the nearest row.
 */
export function getConsumptionPctForWeight(weightG: number, reference: ConsumptionReferenceRow[] = DEFAULT_CONSUMPTION_REFERENCE) {
  if (!reference.length) return null;

  const rows = reference
    .map((item) => ({ weightG: roundWeight(item.weightG), consumptionPct: clampPct(item.consumptionPct) }))
    .sort((a, b) => a.weightG - b.weightG);

  const target = clampWeight(weightG);
  const row = rows.reduce<ConsumptionReferenceRow | null>(
    (acc, item) => (item.weightG <= target ? item : acc),
    null,
  ) ?? rows[0];

  return clampPct(row.consumptionPct);
}

export interface DailyRationInput {
  plCount: number;
  averageWeightG: number;
  /** Latest measured survival. Defaults to 100% while no biometrics exist. */
  survivalPct?: number | null;
  reference?: ConsumptionReferenceRow[];
}

export interface DailyRation {
  biomassKg: number | null;
  consumptionPct: number | null;
  rationKg: number | null;
}

/**
 * How much to feed today: the live biomass — stocked animals that survived,
 * times their current weight — at the rate the table sets for that weight.
 * The number holds until someone changes it, which is why it is a suggestion
 * on the launch form rather than something written automatically.
 */
export function calculateDailyRation({
  plCount,
  averageWeightG,
  survivalPct,
  reference = DEFAULT_CONSUMPTION_REFERENCE,
}: DailyRationInput): DailyRation {
  const weightG = clampWeight(averageWeightG);
  const stocked = clampWeight(plCount);
  const survival = survivalPct == null ? 100 : clampPct(survivalPct);

  if (weightG <= 0 || stocked <= 0) {
    return { biomassKg: null, consumptionPct: null, rationKg: null };
  }

  const biomassKg = (stocked * (survival / 100) * weightG) / 1000;
  const consumptionPct = getConsumptionPctForWeight(weightG, reference);

  if (!consumptionPct || consumptionPct <= 0) {
    return { biomassKg: Number(biomassKg.toFixed(2)), consumptionPct, rationKg: null };
  }

  return {
    biomassKg: Number(biomassKg.toFixed(2)),
    consumptionPct,
    rationKg: Number(((biomassKg * consumptionPct) / 100).toFixed(2)),
  };
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
