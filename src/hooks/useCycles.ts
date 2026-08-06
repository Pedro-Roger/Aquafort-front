import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CyclesSummary {
  activeCycles: number;
  totalPopulation: number;
  totalBiomassKg: number;
  avgFca: number | null;
}
import { api } from '../lib/api';
import type { Cycle, CyclePhase, GrowthChartData, GrowthTarget } from '../types';

interface CyclesFilter {
  status?: 'ativo' | 'encerrado';
  pondId?: string;
  phase?: CyclePhase;
}

export function useCycles(filter?: CyclesFilter) {
  return useQuery<Cycle[]>({
    queryKey: ['cycles', filter],
    queryFn: async () => {
      const { data } = await api.get('/v1/cycles', { params: filter });
      return data.data ?? data;
    },
  });
}

export function useCycle(id: string) {
  return useQuery<Cycle>({
    queryKey: ['cycles', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/cycles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface CreateCycleOriginInput {
  label: string;
  sourceCycleId?: string;
  quantity: number;
}

interface CreateCycleDto {
  pondId: string;
  supplier: string;
  stockDate: string;
  plCount: number;
  initialPhase: CyclePhase;
  larvaeSupplier?: string;
  larvaeLotCode?: string;
  /** Genetic line of the batch, as the hatchery identifies it. */
  geneticCode?: string;
  larvaeStage?: string;
  /** Day of stage at stocking time (day 1 = arrival). */
  stageDay?: number;
  /** Projected/actual date the batch transfers out of this stage. */
  transferDate?: string;
  /** Post-larvae per gram at stocking. */
  plPerGram?: number;
  /** Berçário(s) this viveiro was stocked from, when applicable. */
  origins?: CreateCycleOriginInput[];
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation<Cycle, Error, CreateCycleDto>({
    mutationFn: async (dto) => {
      const payload = {
        pondId: dto.pondId,
        supplier: dto.supplier,
        stockDate: new Date(dto.stockDate).toISOString(),
        plCount: dto.plCount,
        phase: dto.initialPhase,
        ...(dto.larvaeSupplier ? { larvaeSupplier: dto.larvaeSupplier } : {}),
        ...(dto.larvaeLotCode ? { larvaeLotCode: dto.larvaeLotCode } : {}),
        ...(dto.larvaeStage ? { larvaeStage: dto.larvaeStage } : {}),
        ...(dto.geneticCode ? { geneticCode: dto.geneticCode } : {}),
        ...(dto.stageDay ? { stageDay: dto.stageDay } : {}),
        ...(dto.transferDate ? { transferDate: new Date(dto.transferDate).toISOString() } : {}),
        ...(dto.plPerGram ? { plPerGram: dto.plPerGram } : {}),
        ...(dto.origins && dto.origins.length > 0 ? { origins: dto.origins } : {}),
      };
      const { data } = await api.post('/v1/cycles', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
}

export function useCloseCycle() {
  const qc = useQueryClient();
  return useMutation<Cycle, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/v1/cycles/${id}/close`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
}

export function useGrowthChart(cycleId: string | null) {
  return useQuery<GrowthChartData>({
    queryKey: ['cycles', cycleId, 'growth-chart'],
    queryFn: async () => {
      const { data } = await api.get(`/v1/cycles/${cycleId}/growth-chart`);
      return data;
    },
    enabled: !!cycleId,
  });
}

export function useUpdateGrowthTarget() {
  const qc = useQueryClient();
  return useMutation<void, Error, { cycleId: string; target: GrowthTarget }>({
    mutationFn: async ({ cycleId, target }) => {
      await api.put(`/v1/cycles/${cycleId}/growth-target`, target);
    },
    onSuccess: (_, { cycleId }) => {
      qc.invalidateQueries({ queryKey: ['cycles', cycleId, 'growth-chart'] });
    },
  });
}

export function useCyclesSummary() {
  return useQuery<CyclesSummary>({
    queryKey: ['cycles', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/v1/cycles/summary');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useAdvancePhase() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (cycleId: string) => {
      const { data } = await api.post(`/v1/cycles/${cycleId}/advance-phase`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}
