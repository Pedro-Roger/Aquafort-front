import { describe, expect, it } from 'vitest';
import { accumulatedKey, buildChartRows, colorFor, summarise, weightKey } from './consumptionChart';
import type { ConsumptionSeries } from '../hooks/useConsumptionSeries';

const series: ConsumptionSeries[] = [
  {
    pondId: 'p1',
    pondCode: 'VE-01',
    points: [
      { date: '2026-07-01', feedKg: 30, accumulatedKg: 30, averageWeightG: null },
      { date: '2026-07-02', feedKg: 20, accumulatedKg: 50, averageWeightG: 12.5 },
    ],
  },
  {
    pondId: 'p2',
    pondCode: 'VE-02',
    points: [{ date: '2026-07-02', feedKg: 10, accumulatedKg: 10, averageWeightG: 9 }],
  },
];

describe('consumption chart', () => {
  it('puts every pond on the same date axis', () => {
    const rows = buildChartRows(series);

    expect(rows.map((row) => row.date)).toEqual(['2026-07-01', '2026-07-02']);
    expect(rows[1][accumulatedKey('VE-01')]).toBe(50);
    expect(rows[1][accumulatedKey('VE-02')]).toBe(10);
  });

  it('keeps the dates in order even when a pond starts later', () => {
    const rows = buildChartRows([series[1], series[0]]);

    expect(rows.map((row) => row.date)).toEqual(['2026-07-01', '2026-07-02']);
  });

  it('leaves a gap on days with no reading instead of plotting a zero', () => {
    const rows = buildChartRows(series);

    // a zero would draw the weight line to the floor and read as shrinkage
    expect(rows[0][weightKey('VE-01')]).toBeUndefined();
    expect(rows[1][weightKey('VE-01')]).toBe(12.5);
  });

  it('summarises each pond by its total feed and latest weight', () => {
    const summary = summarise(series);

    expect(summary[0]).toEqual(
      expect.objectContaining({ pondCode: 'VE-01', accumulatedKg: 50, averageWeightG: 12.5, days: 2 }),
    );
  });

  it('reports no weight for a pond that has never been measured', () => {
    const [only] = summarise([
      { pondId: 'p3', pondCode: 'VE-03', points: [{ date: '2026-07-01', feedKg: 5, accumulatedKg: 5, averageWeightG: null }] },
    ]);

    expect(only.averageWeightG).toBeNull();
    expect(only.accumulatedKg).toBe(5);
  });

  it('handles a selected pond with no data at all', () => {
    expect(buildChartRows([{ pondId: 'p4', pondCode: 'VE-04', points: [] }])).toEqual([]);
    expect(summarise([{ pondId: 'p4', pondCode: 'VE-04', points: [] }])[0].accumulatedKg).toBe(0);
  });

  it('cycles colours so a seventh pond still gets one', () => {
    expect(colorFor(0)).toBe(colorFor(6));
    expect(colorFor(1)).not.toBe(colorFor(0));
  });
});
