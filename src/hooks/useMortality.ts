import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MortalityRecord, MortalitySeries, MortalityTableResponse } from '../types';

interface MortalityListParams {
  cycleId?: string | null;
  pondId?: string | null;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface CreateMortalityDto {
  cycleId: string;
  pondId: string;
  quantity: number;
  recordedAt: string;
  cause?: string;
  observation?: string;
  responsibleId: string;
}

export function useMortalityTable() {
  return useQuery<MortalityTableResponse>({
    queryKey: ['mortality', 'table'],
    queryFn: async () => {
      const { data } = await api.get('/v1/mortality/table');
      return data;
    },
  });
}

export function useMortalityList(params: MortalityListParams) {
  return useQuery<{ items: MortalityRecord[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['mortality', 'list', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/mortality', { params });
      return data;
    },
  });
}

export function useMortalitySeries(cycleId: string | null) {
  return useQuery<MortalitySeries>({
    queryKey: ['mortality', 'series', cycleId],
    enabled: Boolean(cycleId),
    queryFn: async () => {
      const { data } = await api.get('/v1/mortality/series', { params: { cycleId } });
      return data;
    },
  });
}

export function useCreateMortality() {
  const qc = useQueryClient();
  return useMutation<MortalityRecord, Error, CreateMortalityDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/mortality', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortality'] });
    },
  });
}
