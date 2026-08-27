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

export interface CreateCycleDto {
  pondId: string;
  supplier: string;
  stockDate: string;
  plCount: number;
  initialPhase: CyclePhase;
  larvaeSupplier?: string;
  larvaeLotCode?: string;
  /** Genetic line of the batch, as the hatchery identifies it. */
  geneticCode?: string;
  /** Generation of the genetic line (RF-18/RN-11) — independent field from geneticCode. */
  geneticGeneration?: number;
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

export type UpdateCycleDto = Partial<
  Omit<CreateCycleDto, 'larvaeSupplier' | 'larvaeLotCode' | 'geneticCode' | 'geneticGeneration' | 'transferDate' | 'plPerGram'>
> & {
  larvaeSupplier?: string | null;
  larvaeLotCode?: string | null;
  geneticCode?: string | null;
  geneticGeneration?: number | null;
  transferDate?: string | null;
  plPerGram?: number | null;
};

export function toCyclePayload(dto: CreateCycleDto | UpdateCycleDto) {
  return {
    ...(dto.pondId ? { pondId: dto.pondId } : {}),
    ...(dto.supplier ? { supplier: dto.supplier } : {}),
    ...(dto.stockDate ? { stockDate: new Date(dto.stockDate).toISOString() } : {}),
    ...(dto.plCount !== undefined ? { plCount: dto.plCount } : {}),
    ...(dto.initialPhase ? { phase: dto.initialPhase } : {}),
    ...(dto.larvaeSupplier !== undefined ? { larvaeSupplier: dto.larvaeSupplier } : {}),
    ...(dto.larvaeLotCode !== undefined ? { larvaeLotCode: dto.larvaeLotCode } : {}),
    ...(dto.larvaeStage !== undefined ? { larvaeStage: dto.larvaeStage } : {}),
    ...(dto.geneticCode !== undefined ? { geneticCode: dto.geneticCode } : {}),
    ...(dto.geneticGeneration !== undefined ? { geneticGeneration: dto.geneticGeneration } : {}),
    ...(dto.stageDay !== undefined ? { stageDay: dto.stageDay } : {}),
    ...(dto.transferDate !== undefined
      ? { transferDate: dto.transferDate ? new Date(dto.transferDate).toISOString() : null }
      : {}),
    ...(dto.plPerGram !== undefined ? { plPerGram: dto.plPerGram } : {}),
    ...(dto.origins && dto.origins.length > 0 ? { origins: dto.origins } : {}),
  };
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation<Cycle, Error, CreateCycleDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/cycles', toCyclePayload(dto));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
}

export function useUpdateCycle() {
  const qc = useQueryClient();
  return useMutation<Cycle, Error, { id: string; dto: UpdateCycleDto }>({
    mutationFn: async ({ id, dto }) => {
      const { data } = await api.put(`/v1/cycles/${id}`, toCyclePayload(dto));
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
