import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateHarvestDto, HarvestRecord } from '../types';

export function useCreateHarvestRecord() {
  const qc = useQueryClient();
  return useMutation<HarvestRecord, Error, CreateHarvestDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/harvest-records', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['harvest-schedules'] });
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['ponds'] });
      qc.invalidateQueries({ queryKey: ['operational-reports'] });
    },
  });
}
