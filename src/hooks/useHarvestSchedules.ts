import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { HarvestSchedule, HarvestScheduleStatus } from '../types';

/** Janela consultada pelo calendário: sempre a grade visível do mês. */
interface HarvestSchedulesParams {
  /** YYYY-MM-DD (inclusive). */
  from: string;
  /** YYYY-MM-DD (inclusive). */
  to: string;
  pondId?: string | null;
}

export interface HarvestScheduleParticipantInput {
  name: string;
  userId?: string | null;
  /** Set when the person was picked from the registered feeders. */
  feederId?: string | null;
  role?: string | null;
}

export interface CreateHarvestScheduleDto {
  pondId: string;
  cycleId?: string | null;
  /** ISO com hora. */
  scheduledAt: string;
  status?: HarvestScheduleStatus;
  note?: string | null;
  participants: HarvestScheduleParticipantInput[];
}

/**
 * Todos os campos são opcionais no PATCH. Atenção: enviar `participants`
 * SUBSTITUI a equipe inteira; omitir mantém a que já está salva.
 */
export type UpdateHarvestScheduleDto = Partial<CreateHarvestScheduleDto>;

export function useHarvestSchedules(params: HarvestSchedulesParams) {
  return useQuery<HarvestSchedule[]>({
    queryKey: ['harvest-schedules', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/harvest-schedules', {
        params: { from: params.from, to: params.to, pondId: params.pondId || undefined },
      });
      return data.data ?? data;
    },
  });
}

export function useCreateHarvestSchedule() {
  const qc = useQueryClient();
  return useMutation<HarvestSchedule, Error, CreateHarvestScheduleDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/harvest-schedules', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['harvest-schedules'] });
    },
  });
}

export function useUpdateHarvestSchedule() {
  const qc = useQueryClient();
  return useMutation<HarvestSchedule, Error, { id: string; data: UpdateHarvestScheduleDto }>({
    mutationFn: async ({ id, data: dto }) => {
      const { data } = await api.patch(`/v1/harvest-schedules/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['harvest-schedules'] });
    },
  });
}

export function useDeleteHarvestSchedule() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/v1/harvest-schedules/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['harvest-schedules'] });
    },
  });
}
