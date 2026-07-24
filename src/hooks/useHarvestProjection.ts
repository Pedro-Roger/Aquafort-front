import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { HarvestProjection } from '../types';

export function useHarvestProjection(pondId: string | null, cycleId?: string) {
  return useQuery<HarvestProjection>({
    queryKey: ['harvest-projection', pondId, cycleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/ponds/${pondId}/harvest-projection`, {
        params: cycleId ? { cycleId } : undefined,
      });
      return data;
    },
    enabled: !!pondId,
  });
}

export function useRecomputeHarvestProjection() {
  const qc = useQueryClient();
  return useMutation<HarvestProjection, Error, { pondId: string; cycleId?: string }>({
    mutationFn: async ({ pondId, cycleId }) => {
      const { data } = await api.post(`/v1/ponds/${pondId}/harvest-projection/recompute`, undefined, {
        params: cycleId ? { cycleId } : undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['harvest-projection', data.pondId] });
    },
  });
}
