import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Plus, Users, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceMuted,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { usePonds } from '../hooks/usePonds';
import { useAuth } from '../hooks/useAuth';
import { useFeeders } from '../hooks/useFeeders';
import {
  useCreateHarvestSchedule,
  useDeleteHarvestSchedule,
  useHarvestSchedules,
  useUpdateHarvestSchedule,
  type HarvestScheduleParticipantInput,
} from '../hooks/useHarvestSchedules';
import type { HarvestSchedule, HarvestScheduleStatus } from '../types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_LABEL: Record<HarvestScheduleStatus, string> = {
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as HarvestScheduleStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

/** Cada situação usa apenas tokens do tema — nunca texto claro sobre fundo claro. */
const statusChipStyle: Record<HarvestScheduleStatus, CSSProperties> = {
  AGENDADA: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' },
  CONCLUIDA: { backgroundColor: 'var(--accent-soft-strong)', color: 'var(--accent-dark)' },
  CANCELADA: {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    textDecoration: 'line-through',
  },
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** Chave local YYYY-MM-DD. Usa o fuso do navegador, igual ao que o usuário vê. */
function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeKey(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function brDate(key: string) {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

/** 6 semanas de domingo a sábado cobrindo o mês inteiro. */
function buildMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - firstWeekday + index));
}

interface ScheduleForm {
  id: string | null;
  pondId: string;
  date: string;
  time: string;
  status: HarvestScheduleStatus;
  note: string;
  participants: HarvestScheduleParticipantInput[];
}

function emptyForm(date: string): ScheduleForm {
  return { id: null, pondId: '', date, time: '07:00', status: 'AGENDADA', note: '', participants: [] };
}

export function HarvestCalendarPage() {
  const today = new Date();
  const { user } = useAuth();
  const { data: feeders = [] } = useFeeders();
  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [pondFilter, setPondFilter] = useState('');
  const [form, setForm] = useState<ScheduleForm | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const from = dateKey(grid[0]);
  const to = dateKey(grid[grid.length - 1]);

  const { data: ponds = [] } = usePonds();
  const { data: schedules = [], isLoading } = useHarvestSchedules({ from, to, pondId: pondFilter || undefined });
  const createSchedule = useCreateHarvestSchedule();
  const updateSchedule = useUpdateHarvestSchedule();
  const deleteSchedule = useDeleteHarvestSchedule();

  const pondOptions = ponds.map((pond) => ({ value: pond.id, label: `${pond.code} · ${pond.name}` }));

  const byDay = useMemo(() => {
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
  }, [schedules]);

  const monthSchedules = useMemo(
    () => schedules.filter((schedule) => new Date(schedule.scheduledAt).getMonth() === cursor.month),
    [schedules, cursor.month],
  );

  const summary = {
    total: monthSchedules.length,
    agendadas: monthSchedules.filter((item) => item.status === 'AGENDADA').length,
    concluidas: monthSchedules.filter((item) => item.status === 'CONCLUIDA').length,
    pessoas: new Set(
      monthSchedules.flatMap((item) => item.participants.map((person) => person.name.toLowerCase())),
    ).size,
  };

  const todayKey = dateKey(today);

  function moveMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function goToday() {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  }

  function openCreate(key: string) {
    setError(null);
    setConfirmingDelete(false);
    setParticipantName('');
    setForm({ ...emptyForm(key), pondId: pondFilter || ponds[0]?.id || '' });
  }

  function openEdit(schedule: HarvestSchedule) {
    const when = new Date(schedule.scheduledAt);
    setError(null);
    setConfirmingDelete(false);
    setParticipantName('');
    setForm({
      id: schedule.id,
      pondId: schedule.pondId,
      date: dateKey(when),
      time: timeKey(when),
      status: schedule.status,
      note: schedule.note ?? '',
      participants: schedule.participants.map((person) => ({
        name: person.name,
        userId: person.userId ?? null,
        feederId: person.feederId ?? null,
        role: person.role ?? null,
      })),
    });
  }

  function closeModal() {
    setForm(null);
    setError(null);
    setConfirmingDelete(false);
    setParticipantName('');
  }

  function patchForm(patch: Partial<ScheduleForm>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function addParticipant(person: HarvestScheduleParticipantInput) {
    const name = person.name.trim();
    if (!name) return;
    setForm((current) => {
      if (!current) return current;
      if (current.participants.some((item) => item.name.toLowerCase() === name.toLowerCase())) return current;
      return { ...current, participants: [...current.participants, { ...person, name }] };
    });
    setParticipantName('');
  }

  function removeParticipant(index: number) {
    setForm((current) =>
      current ? { ...current, participants: current.participants.filter((_, i) => i !== index) } : current,
    );
  }

  async function handleSave() {
    if (!form) return;
    setError(null);

    if (!form.pondId || !form.date || !form.time) {
      setError('Informe viveiro, data e hora.');
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    const participants = form.participants.map((person) => ({
      name: person.name,
      userId: person.userId ?? undefined,
      feederId: person.feederId ?? undefined,
      role: person.role ?? undefined,
    }));

    try {
      if (form.id) {
        await updateSchedule.mutateAsync({
          id: form.id,
          data: {
            pondId: form.pondId,
            scheduledAt,
            status: form.status,
            note: form.note.trim() || null,
            participants,
          },
        });
      } else {
        await createSchedule.mutateAsync({
          pondId: form.pondId,
          scheduledAt,
          status: form.status,
          note: form.note.trim() || undefined,
          participants,
        });
      }
    } catch {
      setError('Não foi possível salvar o agendamento. Tente novamente.');
      return;
    }

    closeModal();
  }

  async function handleDelete() {
    if (!form?.id) return;
    try {
      await deleteSchedule.mutateAsync(form.id);
    } catch {
      setError('Não foi possível excluir o agendamento. Tente novamente.');
      return;
    }
    closeModal();
  }

  const saving = createSchedule.isPending || updateSchedule.isPending;

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: space.section,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={workspaceEyebrow}>Despesca</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
              Calendário de despesca
            </h1>
            <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 760 }}>
              Agende as despescas do mês, defina o horário e escale a equipe responsável por cada viveiro.
            </p>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 210 }}>
              <Select
                label="Filtrar por viveiro"
                options={[{ value: '', label: 'Todos os viveiros' }, ...pondOptions]}
                value={pondFilter}
                onChange={(e) => setPondFilter(e.target.value)}
              />
            </div>
            <Button icon={<Plus size={16} />} onClick={() => openCreate(todayKey)}>
              Novo agendamento
            </Button>
          </div>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <StatCard label="Despescas no mês" value={isLoading ? '—' : summary.total} icon={<CalendarDays size={18} />} />
          <StatCard label="Agendadas" value={summary.agendadas} icon={<CalendarDays size={18} />} />
          <StatCard label="Concluídas" value={summary.concluidas} icon={<CheckCircle2 size={18} />} />
          <StatCard label="Pessoas escaladas" value={summary.pessoas} icon={<Users size={18} />} />
        </div>
      </div>

      <div style={workspaceCard}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.tile,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={sectionTitle}>{`${MONTHS[cursor.month]} de ${cursor.year}`}</h2>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'center' }}>
            <Button variant="secondary" size="sm" aria-label="Mês anterior" onClick={() => moveMonth(-1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToday}>
              Hoje
            </Button>
            <Button variant="secondary" size="sm" aria-label="Próximo mês" onClick={() => moveMonth(1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                style={{
                  ...workspaceTileLabel,
                  textAlign: 'center',
                  paddingBottom: 6,
                }}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
            {grid.map((day) => {
              const key = dateKey(day);
              const inMonth = day.getMonth() === cursor.month;
              const isToday = key === todayKey;
              const items = byDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Agendar despesca em ${brDate(key)}`}
                  onClick={() => openCreate(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openCreate(key);
                    }
                  }}
                  style={{
                    ...workspaceTile,
                    padding: 8,
                    minHeight: 104,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    cursor: 'pointer',
                    opacity: inMonth ? 1 : 0.55,
                    backgroundColor: isToday ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    borderColor: isToday ? 'var(--border-focus)' : 'var(--border)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isToday ? 800 : 600,
                      color: inMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {day.getDate()}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {items.map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        aria-label={`Editar despesca ${schedule.pond.code} ${timeKey(new Date(schedule.scheduledAt))}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(schedule);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          width: '100%',
                          padding: '4px 7px',
                          border: '1px solid var(--border)',
                          borderRadius: radius.control,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          ...statusChipStyle[schedule.status],
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {schedule.pond.code}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {timeKey(new Date(schedule.scheduledAt))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isLoading && summary.total === 0 && (
          <EmptyState
            title="Nenhuma despesca agendada neste mês"
            description="Clique em um dia do calendário para criar o primeiro agendamento."
            icon={<CalendarDays size={22} />}
            compact
          />
        )}

        <p style={workspaceMuted}>
          Clique num dia livre para agendar. Clique num agendamento para editar a equipe, o horário ou excluir.
        </p>
      </div>

      <Modal
        open={form !== null}
        onClose={closeModal}
        title={form?.id ? 'Editar agendamento' : 'Novo agendamento'}
        width={560}
      >
        {form && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.section }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Select
                  label="Viveiro"
                  options={pondOptions}
                  placeholder="Selecione o viveiro"
                  value={form.pondId}
                  onChange={(e) => patchForm({ pondId: e.target.value })}
                />
              </div>
              <Input label="Data" type="date" value={form.date} onChange={(e) => patchForm({ date: e.target.value })} />
              <Input label="Hora" type="time" value={form.time} onChange={(e) => patchForm({ time: e.target.value })} />
              <Select
                label="Situação"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value as HarvestScheduleStatus })}
              />
              <Input
                label="Observação"
                value={form.note}
                onChange={(e) => patchForm({ note: e.target.value })}
                placeholder="Ex.: iniciar pelo comporta norte"
              />
            </div>

            <div style={{ ...workspaceTile, display: 'flex', flexDirection: 'column', gap: space.inline }}>
              <div style={workspaceTileLabel}>Equipe</div>

              <div style={{ display: 'flex', gap: space.inline, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Participante"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addParticipant({ name: participantName });
                      }
                    }}
                    placeholder="Nome de quem vai participar"
                  />
                </div>
                <Button variant="secondary" onClick={() => addParticipant({ name: participantName })}>
                  Adicionar
                </Button>
              </div>

              {/* Escalar quem já está cadastrado, sem impedir um nome digitado. */}
              {feeders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={workspaceTileLabel}>Arraçoadores cadastrados</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {feeders.map((feeder) => {
                      const already = form.participants.some(
                        (person) => person.feederId === feeder.id || person.name.toLowerCase() === feeder.name.toLowerCase(),
                      );
                      return (
                        <Button
                          key={feeder.id}
                          variant="secondary"
                          size="sm"
                          disabled={already}
                          onClick={() => addParticipant({ name: feeder.name, feederId: feeder.id })}
                        >
                          {already ? `${feeder.name} ✓` : feeder.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => addParticipant({ name: user.name, userId: user.id })}
                >
                  {`Adicionar ${user.name}`}
                </Button>
              )}

              {form.participants.length === 0 ? (
                <span style={workspaceMuted}>Nenhuma pessoa escalada ainda.</span>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.participants.map((person, index) => (
                    <li
                      key={`${person.name}-${index}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 8px',
                        borderRadius: radius.pill,
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-dark)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {person.name}
                      <button
                        type="button"
                        aria-label={`Remover ${person.name}`}
                        onClick={() => removeParticipant(index)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--accent-dark)',
                        }}
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: radius.tile,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {confirmingDelete ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.tile,
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border)',
                  paddingTop: space.section,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Excluir este agendamento definitivamente?
                </span>
                <div style={{ display: 'flex', gap: space.inline }}>
                  <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                    Manter
                  </Button>
                  <Button variant="danger" loading={deleteSchedule.isPending} onClick={handleDelete}>
                    Confirmar exclusão
                  </Button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.tile,
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border)',
                  paddingTop: space.section,
                }}
              >
                {form.id ? (
                  <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                    Excluir
                  </Button>
                ) : (
                  <span style={workspaceMuted}>{brDate(form.date)}</span>
                )}
                <div style={{ display: 'flex', gap: space.inline }}>
                  <Button variant="secondary" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button loading={saving} onClick={handleSave}>
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div style={{ ...workspaceTile, minHeight: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={workspaceTileLabel}>{label}</div>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.control,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-dark)',
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ ...workspaceTileValue, marginTop: 10 }}>{value}</div>
    </div>
  );
}
