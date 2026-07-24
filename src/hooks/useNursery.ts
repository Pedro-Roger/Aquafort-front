import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NurseryActivity } from '../types';

interface NurseryActivitiesParams {
  pondId?: string | null;
  date?: string;
}

interface CreateNurseryActivityDto {
  pondId: string;
  measuredAt: string;
  plGram: number;
  probioticKg?: number;
  bicarbonateKg?: number;
  chlorineKg?: number;
  bokashiKg?: number;
  waterManagementType?: string;
  waterManagementNote?: string;
  observation?: string;
}

export function useNurseryActivities(params: NurseryActivitiesParams) {
  return useQuery<NurseryActivity[]>({
    queryKey: ['nursery', 'activities', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/nursery/activities', { params });
      return data;
    },
  });
}

export function useCreateNurseryActivity() {
  const qc = useQueryClient();
  return useMutation<NurseryActivity, Error, CreateNurseryActivityDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/nursery/activities', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nursery'] });
    },
  });
}
