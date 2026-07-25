import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONSUMPTION_REFERENCE,
  getConsumptionPctForWeight,
  normalizeConsumptionReference,
} from './biometricsReference';

describe('consumption reference', () => {
  it('covers the whole cycle, from post-larvae to harvest weight', () => {
    const weights = DEFAULT_CONSUMPTION_REFERENCE.map((row) => row.weightG);

    expect(Math.min(...weights)).toBeLessThanOrEqual(0.1);
    expect(Math.max(...weights)).toBeGreaterThanOrEqual(21);
  });

  it('never rises as the shrimp gets heavier', () => {
    const sorted = [...DEFAULT_CONSUMPTION_REFERENCE].sort((a, b) => a.weightG - b.weightG);

    sorted.forEach((row, index) => {
      if (index === 0) return;
      expect(row.consumptionPct).toBeLessThanOrEqual(sorted[index - 1].consumptionPct);
    });
  });

  it('starts around 15% for post-larvae and ends at 2% at harvest', () => {
    expect(getConsumptionPctForWeight(0.1)).toBeCloseTo(15, 1);
    expect(getConsumptionPctForWeight(21)).toBeCloseTo(2, 1);
  });

  it('reads the rate for weights between two rows', () => {
    const atFour = getConsumptionPctForWeight(4.4)!;

    expect(atFour).toBeLessThanOrEqual(getConsumptionPctForWeight(4)!);
    expect(atFour).toBeGreaterThanOrEqual(getConsumptionPctForWeight(5)!);
  });

  it('clamps weights past the end of the table to the lightest and heaviest rates', () => {
    expect(getConsumptionPctForWeight(0.01)).toBe(getConsumptionPctForWeight(0.1));
    expect(getConsumptionPctForWeight(40)).toBe(getConsumptionPctForWeight(22));
  });

  it('keeps a custom sub-gram row through normalisation', () => {
    const normalized = normalizeConsumptionReference([{ weightG: 0.1, consumptionPct: 18 }]);
    const row = normalized.find((item) => item.weightG === 0.1);

    expect(row?.consumptionPct).toBe(18);
  });

  it('fills the gaps with the default table', () => {
    const normalized = normalizeConsumptionReference([{ weightG: 10, consumptionPct: 3 }]);

    expect(normalized.find((item) => item.weightG === 10)?.consumptionPct).toBe(3);
    expect(normalized.length).toBe(DEFAULT_CONSUMPTION_REFERENCE.length);
  });
});
