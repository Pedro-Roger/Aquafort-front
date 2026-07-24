import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Biometric, BiometricKpis, BiometricSeries } from '../types';

export function useBiometrics(cycleId: string | null) {
  return useQuery<Biometric[]>({
    queryKey: ['biometrics', cycleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/biometrics?cycleId=${cycleId}`);
      return data;
    },
    enabled: !!cycleId,
  });
}

export function useCreateBiometric() {
  const qc = useQueryClient();
  return useMutation<Biometric, Error, Omit<Biometric, 'id' | 'createdAt'>>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/biometrics', dto);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['biometrics', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'series', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'kpis', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['cycles', data.cycleId, 'growth-chart'] });
    },
  });
}

export function useDeleteBiometric() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; cycleId: string }>({
    mutationFn: async ({ id }) => {
      await api.delete(`/v1/biometrics/${id}`);
    },
    onSuccess: (_, { cycleId }) => {
      qc.invalidateQueries({ queryKey: ['biometrics', cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'series', cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'kpis', cycleId] });
      qc.invalidateQueries({ queryKey: ['cycles', cycleId, 'growth-chart'] });
    },
  });
}

export function useBiometricSeries(cycleId: string | null) {
  return useQuery<BiometricSeries>({
    queryKey: ['biometrics', 'series', cycleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/biometrics/growth-series?cycleId=${cycleId}`);
      return data;
    },
    enabled: !!cycleId,
  });
}

export function useBiometricKpis(cycleId: string | null) {
  return useQuery<BiometricKpis>({
    queryKey: ['biometrics', 'kpis', cycleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/biometrics/kpis?cycleId=${cycleId}`);
      return data;
    },
    enabled: !!cycleId,
  });
}
