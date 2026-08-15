import type { HarvestSchedule } from '../types';

export interface HarvestScheduleSummary {
  total: number;
  agendadas: number;
  concluidas: number;
  pessoas: number;
}

export function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Chave local YYYY-MM-DD. Usa o fuso do navegador, igual ao que o usuário vê. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeKey(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function brDate(key: string): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

/** 6 semanas de domingo a sábado cobrindo o mês inteiro. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - firstWeekday + index));
}

/** Agrupa os agendamentos pela chave do dia local, ordenados por horário dentro do dia. */
export function groupSchedulesByDay(schedules: HarvestSchedule[]): Map<string, HarvestSchedule[]> {
  const map = new Map<string, HarvestSchedule[]>();
  for (const schedule of schedules) {
    const key = dateKey(new Date(schedule.scheduledAt));
    const list = map.get(key);
    if (list) list.push(schedule);
    else map.set(key, [schedule]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  return map;
}

/** Contadores do mês exibido nos cartões de resumo do topo. */
export function summarizeMonthSchedules(schedules: HarvestSchedule[], month: number): HarvestScheduleSummary {
  const monthSchedules = schedules.filter((schedule) => new Date(schedule.scheduledAt).getMonth() === month);

  return {
    total: monthSchedules.length,
    agendadas: monthSchedules.filter((item) => item.status === 'AGENDADA').length,
    concluidas: monthSchedules.filter((item) => item.status === 'CONCLUIDA').length,
    pessoas: new Set(
      monthSchedules.flatMap((item) => item.participants.map((person) => person.name.toLowerCase())),
    ).size,
  };
}
