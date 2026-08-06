import { describe, expect, it } from 'vitest';
import {
  calculateOriginBalance,
  calculatePovoamentoQuantity,
  getAllocationSummary,
  quantityFromWeight,
  sumOriginQuantities,
  validateAllocationRows,
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
