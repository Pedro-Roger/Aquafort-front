import { describe, expect, it } from 'vitest';
import {
  brDate,
  buildMonthGrid,
  dateKey,
  groupSchedulesByDay,
  pad,
  summarizeMonthSchedules,
  timeKey,
} from './harvestCalendar';
import type { HarvestSchedule } from '../types';

function schedule(overrides: Partial<HarvestSchedule>): HarvestSchedule {
  return {
    id: 'hs-1',
    pondId: 'p1',
    cycleId: null,
    scheduledAt: '2026-07-15T08:30:00.000Z',
    status: 'AGENDADA',
    note: null,
    pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01', areaHa: 1.4 },
    cycle: null,
    participants: [],
    ...overrides,
  };
}

describe('pad', () => {
  it('pads single digits with a leading zero', () => {
    expect(pad(3)).toBe('03');
    expect(pad(12)).toBe('12');
  });
});

describe('dateKey', () => {
  it('builds a local YYYY-MM-DD key', () => {
    expect(dateKey(new Date(2026, 6, 5))).toBe('2026-07-05');
  });
});

describe('timeKey', () => {
  it('builds a local HH:mm key', () => {
    expect(timeKey(new Date(2026, 6, 5, 7, 5))).toBe('07:05');
  });
});

describe('brDate', () => {
  it('converts a YYYY-MM-DD key to Brazilian date format', () => {
    expect(brDate('2026-07-05')).toBe('05/07/2026');
  });
});

describe('buildMonthGrid', () => {
  it('returns 42 days starting on the Sunday before the 1st', () => {
    const grid = buildMonthGrid(2026, 6); // July 2026, 1st is a Wednesday
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(0);
    expect(dateKey(grid[0])).toBe('2026-06-28');
  });

  it('covers the entire month', () => {
    const grid = buildMonthGrid(2026, 6);
    const inMonth = grid.filter((day) => day.getMonth() === 6);
    expect(inMonth).toHaveLength(31);
  });
});

describe('groupSchedulesByDay', () => {
  it('groups schedules by their local day key', () => {
    const schedules = [
      schedule({ id: 'a', scheduledAt: new Date(2026, 6, 15, 8, 30).toISOString() }),
      schedule({ id: 'b', scheduledAt: new Date(2026, 6, 15, 6, 0).toISOString() }),
      schedule({ id: 'c', scheduledAt: new Date(2026, 6, 20, 9, 0).toISOString() }),
    ];

    const byDay = groupSchedulesByDay(schedules);

    expect([...byDay.keys()]).toEqual(['2026-07-15', '2026-07-20']);
    expect(byDay.get('2026-07-15')?.map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('summarizeMonthSchedules', () => {
  it('counts schedules only within the given month', () => {
    const schedules = [
      schedule({ id: 'a', scheduledAt: new Date(2026, 6, 15).toISOString(), status: 'AGENDADA', participants: [{ id: 'p1', name: 'Ana' }] }),
      schedule({ id: 'b', scheduledAt: new Date(2026, 6, 20).toISOString(), status: 'CONCLUIDA', participants: [{ id: 'p2', name: 'ana' }, { id: 'p3', name: 'Carla' }] }),
      schedule({ id: 'c', scheduledAt: new Date(2026, 7, 1).toISOString(), status: 'AGENDADA', participants: [] }),
    ];

    const summary = summarizeMonthSchedules(schedules, 6);

    expect(summary.total).toBe(2);
    expect(summary.agendadas).toBe(1);
    expect(summary.concluidas).toBe(1);
    // "Ana" and "ana" are the same person, case-insensitively.
    expect(summary.pessoas).toBe(2);
  });
});
