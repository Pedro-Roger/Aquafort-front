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

/**
 * Dedicated create DTO, decoupled from the `Biometric` read shape — same
 * pattern every other create hook in the project already follows (e.g.
 * `CreateCycleDto` in useCycles.ts). `Biometric` is what the API returns for
 * an already-persisted reading; the payload a form sends to create one is a
 * different, narrower shape (no `id`/`createdAt`/`responsible`, and RF-16
 * dropped `sampleCount` from every form that used to send it).
 */
export interface CreateBiometricDto {
  cycleId: string;
  measuredAt: string;
  averageWeightG: number;
  /** RN-13/RF-16: optional — no biometry form collects it anymore. */
  sampleCount?: number;
  survivalRatePct?: number;
  estimatedBiomass?: number;
  responsibleId?: string;
}

export function useCreateBiometric() {
  const qc = useQueryClient();
  return useMutation<Biometric, Error, CreateBiometricDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/biometrics', dto);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['biometrics', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'series', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'kpis', data.cycleId] });
      qc.invalidateQueries({ queryKey: ['cycles', data.cycleId, 'growth-chart'] });
      // Pond grid cards read from this query separately — missing this left
      // a card showing "Nenhuma leitura registrada" after a real save.
      qc.invalidateQueries({ queryKey: ['biometrics', 'latest-by-pond'] });
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
      qc.invalidateQueries({ queryKey: ['biometrics', 'latest-by-pond'] });
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

export interface LatestPondBiometric {
  pondId: string;
  pondCode: string;
  cycleId: string;
  measuredAt: string;
  averageWeightG: number;
  survivalRatePct: number | null;
  estimatedBiomassKg: number | null;
}

/** Most recent reading of each pond's active cycle, for the pond cards. */
export function useLatestBiometricsByPond() {
  return useQuery<LatestPondBiometric[]>({
    queryKey: ['biometrics', 'latest-by-pond'],
    queryFn: async () => {
      const { data } = await api.get('/v1/biometrics/latest-by-pond');
      return data;
    },
  });
}
