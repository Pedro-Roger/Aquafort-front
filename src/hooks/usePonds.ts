import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CanvasLayout, Pond, PondStatus, PondType, PondWithCanvas } from '../types';

interface PondsFilter {
  status?: PondStatus;
  type?: PondType;
}

/**
 * The endpoint paginates (max 100 per page) even though every caller here
 * wants the full farm roster — dropdowns, the registry table, the dashboard
 * pond picker. Walk every page rather than hardcoding a limit, so a farm
 * that grows past what fits on one page doesn't quietly lose ponds again.
 */
export function usePonds(filter?: PondsFilter) {
  return useQuery<Pond[]>({
    queryKey: ['ponds', filter],
    queryFn: async () => {
      const first = await api.get('/v1/ponds', { params: { ...filter, page: 1, limit: 100 } });
      const ponds: Pond[] = first.data.data ?? first.data;
      const totalPages: number = first.data.totalPages ?? 1;

      if (totalPages <= 1) return ponds;

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          api.get('/v1/ponds', { params: { ...filter, page: index + 2, limit: 100 } }),
        ),
      );

      return [...ponds, ...rest.flatMap((response) => response.data.data ?? response.data)];
    },
  });
}

export function usePond(id: string) {
  return useQuery<Pond>({
    queryKey: ['ponds', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/ponds/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

interface CreatePondDto {
  code: string;
  name: string;
  type: PondType;
  areaHa: number;
}

export function useCreatePond() {
  const qc = useQueryClient();
  return useMutation<Pond, Error, CreatePondDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/ponds', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ponds'] });
      qc.invalidateQueries({ queryKey: ['ponds', 'canvas'] });
    },
  });
}

export function usePondCanvas() {
  return useQuery<PondWithCanvas[]>({
    queryKey: ['ponds', 'canvas'],
    queryFn: async () => {
      const { data } = await api.get('/v1/ponds/canvas');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useUpdateCanvasLayout() {
  const qc = useQueryClient();
  return useMutation<CanvasLayout, Error, { pondId: string; layout: Partial<CanvasLayout> }>({
    mutationFn: async ({ pondId, layout }) => {
      const { data } = await api.put(`/v1/ponds/${pondId}/canvas-layout`, layout);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ponds', 'canvas'] });
    },
  });
}

export function useUpdatePond() {
  const qc = useQueryClient();
  return useMutation<Pond, Error, { id: string; data: Partial<Pond> }>({
    mutationFn: async ({ id, data }) => {
      const { data: response } = await api.put(`/v1/ponds/${id}`, data);
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ponds'] });
      qc.invalidateQueries({ queryKey: ['ponds', 'canvas'] });
    },
  });
}
