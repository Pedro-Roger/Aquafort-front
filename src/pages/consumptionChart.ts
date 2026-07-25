import type { ConsumptionSeries } from '../hooks/useConsumptionSeries';

export interface ChartRow {
  date: string;
  [key: string]: string | number | null;
}

/** Line colours, in the order ponds get picked. */
export const SERIES_COLORS = ['#0284c7', '#f97316', '#16a34a', '#7c3aed', '#dc2626', '#0891b2'];

export function colorFor(index: number) {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export function accumulatedKey(pondCode: string) {
  return `${pondCode} · ração`;
}

export function weightKey(pondCode: string) {
  return `${pondCode} · peso`;
}

/**
 * Recharts wants one row per date with a column per line, while the API gives
 * one series per pond. Ponds are stitched together on the date axis, and a pond
 * with no reading for a date leaves a gap rather than a zero — a zero would
 * draw the line down to the floor and read as "the shrimp shrank".
 */
export function buildChartRows(series: ConsumptionSeries[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();

  for (const pond of series) {
    for (const point of pond.points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[accumulatedKey(pond.pondCode)] = point.accumulatedKg;
      if (point.averageWeightG != null) {
        row[weightKey(pond.pondCode)] = point.averageWeightG;
      }
      byDate.set(point.date, row);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Feed offered per kilo grown so far, per pond — the chart's headline number. */
export function summarise(series: ConsumptionSeries[]) {
  return series.map((pond) => {
    const last = pond.points.at(-1) ?? null;
    const readings = pond.points.filter((point) => point.averageWeightG != null);
    const lastWeight = readings.at(-1)?.averageWeightG ?? null;

    return {
      pondId: pond.pondId,
      pondCode: pond.pondCode,
      accumulatedKg: last?.accumulatedKg ?? 0,
      averageWeightG: lastWeight,
      days: pond.points.length,
    };
  });
}
