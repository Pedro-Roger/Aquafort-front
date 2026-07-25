import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Feeder, FeederRanking } from '../types';

export function useFeeders() {
  return useQuery<Feeder[]>({
    queryKey: ['feeders'],
    queryFn: async () => {
      const { data } = await api.get('/v1/feeders');
      return data;
    },
  });
}

export function useFeederRanking() {
  return useQuery<FeederRanking[]>({
    queryKey: ['feeders', 'ranking'],
    queryFn: async () => {
      const { data } = await api.get('/v1/feeders/ranking');
      return data;
    },
  });
}

interface CreateFeederDto {
  name: string;
  document?: string;
  phone?: string;
}

export function useCreateFeeder() {
  const qc = useQueryClient();
  return useMutation<Feeder, Error, CreateFeederDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/feeders', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feeders'] }),
  });
}

export function useAssignPonds() {
  const qc = useQueryClient();
  return useMutation<Feeder, Error, { feederId: string; pondIds: string[] }>({
    mutationFn: async ({ feederId, pondIds }) => {
      const { data } = await api.put(`/v1/feeders/${feederId}/ponds`, { pondIds });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feeders'] }),
  });
}
