export interface ProductivityInput {
  /** Live biomass in the pond right now. */
  biomassKg: number;
  areaHa: number;
  /** Days elapsed since stocking. */
  days: number;
}

export interface Productivity {
  kgPerHa: number | null;
  kgPerHaPerDay: number | null;
}

/**
 * How much the pond is producing per hectare per day — the number used to
 * compare ponds of different sizes and cycles of different lengths.
 *
 * 3.000 kg in a 3 ha pond after 30 days is 1.000 kg/ha, which is 33 kg/ha/dia.
 */
export function calculateProductivity({ biomassKg, areaHa, days }: ProductivityInput): Productivity {
  const biomass = Number.isFinite(biomassKg) ? Math.max(0, biomassKg) : 0;
  const area = Number.isFinite(areaHa) ? Math.max(0, areaHa) : 0;
  const elapsed = Number.isFinite(days) ? Math.max(0, days) : 0;

  if (biomass <= 0 || area <= 0 || elapsed <= 0) {
    return { kgPerHa: null, kgPerHaPerDay: null };
  }

  const kgPerHa = biomass / area;

  return {
    kgPerHa: Number(kgPerHa.toFixed(2)),
    kgPerHaPerDay: Number((kgPerHa / elapsed).toFixed(2)),
  };
}

export function formatProductivity(kgPerHaPerDay: number | null) {
  if (kgPerHaPerDay == null) return '—';
  return `${kgPerHaPerDay.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg/ha/dia`;
}

/** Whole days between stocking and a reading. */
export function daysSince(stockDate: string | Date, until: string | Date = new Date()) {
  const start = new Date(stockDate).getTime();
  const end = new Date(until).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / (24 * 60 * 60 * 1000)));
}
