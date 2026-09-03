import type { ConsumptionSeries } from '../hooks/useConsumptionSeries';
import type { Pond } from '../types';

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

export function dailyKey(pondCode: string) {
  return `${pondCode} · diário`;
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
export function buildChartRows(series: ConsumptionSeries[], ponds: Pond[]): ChartRow[] {
  if (series.length === 0) return [];
  
  const byDate = new Map<string, ChartRow>();
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';
  
  const pondAreaMap = new Map<string, number>();
  for (const p of ponds) pondAreaMap.set(p.id, p.areaHa || 1);

  for (const pond of series) {
    const area = pondAreaMap.get(pond.pondId) || 1;
    for (const point of pond.points) {
      if (point.date < minDate) minDate = point.date;
      if (point.date > maxDate) maxDate = point.date;
      
      const row = byDate.get(point.date) ?? { date: point.date };
      row[accumulatedKey(pond.pondCode)] = point.accumulatedKg;
      row[dailyKey(pond.pondCode)] = Number((point.feedKg / area).toFixed(1));
      
      if (point.averageWeightG != null) {
        row[weightKey(pond.pondCode)] = point.averageWeightG;
      }
      byDate.set(point.date, row);
    }
  }

  if (minDate === '9999-99-99') return [];

  const current = new Date(`${minDate}T12:00:00Z`);
  const end = new Date(`${maxDate}T12:00:00Z`);
  
  while (current <= end) {
    const dStr = current.toISOString().split('T')[0];
    if (!byDate.has(dStr)) {
      byDate.set(dStr, { date: dStr });
    }
    current.setDate(current.getDate() + 1);
  }

  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  
  for (const pond of series) {
    const accKey = accumulatedKey(pond.pondCode);
    const dailyK = dailyKey(pond.pondCode);
    let lastVal = 0;
    for (const row of rows) {
      if (row[accKey] != null) {
        lastVal = row[accKey] as number;
      } else {
        row[accKey] = lastVal;
      }
      if (row[dailyK] == null) {
        row[dailyK] = 0;
      }
    }
  }

  return rows;
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
