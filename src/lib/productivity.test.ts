import { describe, expect, it } from 'vitest';
import { calculateProductivity, formatProductivity } from './productivity';

describe('pond productivity', () => {
  it('follows the example: 3.000 kg in 3 ha over 30 days is 33 kg/ha/dia', () => {
    const result = calculateProductivity({ biomassKg: 3000, areaHa: 3, days: 30 });

    expect(result.kgPerHa).toBeCloseTo(1000, 2);
    expect(result.kgPerHaPerDay).toBeCloseTo(33.33, 2);
  });

  it('scales with the pond area', () => {
    const small = calculateProductivity({ biomassKg: 3000, areaHa: 1, days: 30 });
    const large = calculateProductivity({ biomassKg: 3000, areaHa: 6, days: 30 });

    expect(small.kgPerHaPerDay).toBeCloseTo(100, 2);
    expect(large.kgPerHaPerDay).toBeCloseTo(16.67, 2);
  });

  it('falls as the same biomass takes longer to reach', () => {
    const fast = calculateProductivity({ biomassKg: 3000, areaHa: 3, days: 30 });
    const slow = calculateProductivity({ biomassKg: 3000, areaHa: 3, days: 60 });

    expect(slow.kgPerHaPerDay).toBeLessThan(fast.kgPerHaPerDay!);
  });

  it('has nothing to report without an area or without elapsed days', () => {
    expect(calculateProductivity({ biomassKg: 3000, areaHa: 0, days: 30 }).kgPerHaPerDay).toBeNull();
    expect(calculateProductivity({ biomassKg: 3000, areaHa: 3, days: 0 }).kgPerHaPerDay).toBeNull();
  });

  it('has nothing to report before any biomass exists', () => {
    expect(calculateProductivity({ biomassKg: 0, areaHa: 3, days: 30 }).kgPerHaPerDay).toBeNull();
  });

  it('formats for reading, with the unit spelled out', () => {
    expect(formatProductivity(33.333)).toBe('33,3 kg/ha/dia');
    expect(formatProductivity(null)).toBe('—');
  });
});
