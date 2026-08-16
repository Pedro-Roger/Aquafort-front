import { describe, expect, it } from 'vitest';
import {
  calculateOriginBalance,
  calculatePovoamentoQuantity,
  collectTransferOriginCycleIds,
  getAllocationSummary,
  quantityFromWeight,
  sumOriginQuantities,
  validateAllocationRows,
  validateTransferBiometry,
  weightFromQuantity,
} from './povoamento';

describe('povoamento allocations', () => {
  it('blocks totals above the available lot quantity', () => {
    const result = validateAllocationRows([
      { pondId: '1', quantity: 600 },
      { pondId: '2', quantity: 500 },
    ], 1000);

    expect(result.valid).toBe(false);
    expect(result.message).toContain('maior do que o total');
  });

  it('summarizes allocated and remaining quantities', () => {
    const summary = getAllocationSummary([
      { pondId: '1', quantity: 300 },
      { pondId: '2', quantity: 450 },
    ], 1000);

    expect(summary.allocated).toBe(750);
    expect(summary.remaining).toBe(250);
    expect(summary.isOverallocated).toBe(false);
  });

  it('calculates larvae using area, density and optional bonus', () => {
    const calculation = calculatePovoamentoQuantity(1, 8, 15);

    expect(calculation.areaM2).toBe(10000);
    expect(calculation.baseLarvae).toBe(80000);
    expect(calculation.bonusLarvae).toBe(12000);
    expect(calculation.totalLarvae).toBe(92000);
  });

  it('treats bonus as optional when omitted', () => {
    const calculation = calculatePovoamentoQuantity(1.4, 8);

    expect(calculation.areaM2).toBe(14000);
    expect(calculation.baseLarvae).toBe(112000);
    expect(calculation.bonusLarvae).toBe(0);
    expect(calculation.totalLarvae).toBe(112000);
  });
});

describe('povoamento weight/quantity conversion', () => {
  it('converts quantity to weight using PL/grama', () => {
    expect(weightFromQuantity(500_000, 250)).toBe(2000);
  });

  it('converts weight to quantity using PL/grama, rounded', () => {
    expect(quantityFromWeight(2000, 250)).toBe(500_000);
    expect(quantityFromWeight(7.301, 250)).toBe(1825); // 1825.25 rounds down to 1825
  });

  it('returns 0 when PL/grama is missing or invalid', () => {
    expect(weightFromQuantity(500_000, 0)).toBe(0);
    expect(quantityFromWeight(2000, -1)).toBe(0);
  });

  it('treats a zero quantity or weight as valid, not invalid', () => {
    expect(weightFromQuantity(0, 250)).toBe(0);
    expect(quantityFromWeight(0, 250)).toBe(0);
  });
});

describe('povoamento origin math', () => {
  it('sums quantities across selected origins', () => {
    const total = sumOriginQuantities([
      { sourceCycleId: 'a', label: 'Berçário 124', quantity: 200_000 },
      { sourceCycleId: 'b', label: 'Berçário 117', quantity: 100_000 },
    ]);
    expect(total).toBe(300_000);
  });

  it('flags a request above the remaining balance without throwing', () => {
    const balance = calculateOriginBalance(500_000, 400_000, 150_000);
    expect(balance.remaining).toBe(100_000);
    expect(balance.isOverdrawn).toBe(true);
  });

  it('does not flag a request within the remaining balance', () => {
    const balance = calculateOriginBalance(500_000, 200_000, 150_000);
    expect(balance.remaining).toBe(300_000);
    expect(balance.isOverdrawn).toBe(false);
  });

  it('does not flag a request exactly equal to the remaining balance', () => {
    const balance = calculateOriginBalance(500_000, 350_000, 150_000);
    expect(balance.remaining).toBe(150_000);
    expect(balance.isOverdrawn).toBe(false);
  });
});

describe('collectTransferOriginCycleIds (RF-13)', () => {
  it('collects the origin cycle ids drawn on across every destination row', () => {
    const ids = collectTransferOriginCycleIds([
      { origins: [{ sourceCycleId: 'a', label: 'Berçário A', quantity: 5000 }] },
      { origins: [{ sourceCycleId: 'b', label: 'Berçário B', quantity: 3000 }] },
    ]);
    expect(ids).toEqual(['a', 'b']);
  });

  it('dedupes an origin drawn on by more than one destination row', () => {
    const ids = collectTransferOriginCycleIds([
      { origins: [{ sourceCycleId: 'a', label: 'Berçário A', quantity: 2000 }] },
      { origins: [{ sourceCycleId: 'a', label: 'Berçário A', quantity: 1000 }] },
    ]);
    expect(ids).toEqual(['a']);
  });

  it('ignores an origin selected but left at zero quantity', () => {
    const ids = collectTransferOriginCycleIds([
      { origins: [{ sourceCycleId: 'a', label: 'Berçário A', quantity: 0 }] },
    ]);
    expect(ids).toEqual([]);
  });

  it('returns an empty list for rows without origins (non-transfer allocations)', () => {
    expect(collectTransferOriginCycleIds([{}])).toEqual([]);
  });
});

describe('validateTransferBiometry (RF-14)', () => {
  it('requires sampleCount when plPerGram was informed', () => {
    const result = validateTransferBiometry(250, 0);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('amostras');
  });

  it('passes when plPerGram and sampleCount are both informed', () => {
    expect(validateTransferBiometry(250, 20).valid).toBe(true);
  });

  it('does not require sampleCount when plPerGram was not informed (field stays optional)', () => {
    expect(validateTransferBiometry(0, 0).valid).toBe(true);
  });
});
