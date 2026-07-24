import { describe, expect, it } from 'vitest';
import { calculatePovoamentoQuantity, getAllocationSummary, validateAllocationRows } from './povoamento';

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
