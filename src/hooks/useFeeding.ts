import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { FcaSeries, FeedingRecord, FeedingTableResponse, FeedProduct } from '../types';

interface FeedingListParams {
  cycleId?: string | null;
  pondId?: string | null;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface FeedingTableParams {
  cycleId?: string | null;
  pondId?: string | null;
  date?: string;
}

interface FeedingAggregate {
  cycleId: string;
  pondId: string | null;
  racaoAcumuladaKg: number;
  custoRacaoAcumulado: number;
  custoMedioRacao: number | null;
}

interface CreateExpressFeedingDto {
  cycleId: string;
  pondId: string;
  productId: string;
  feedKg: number;
  fedAt: string;
  responsibleId: string;
  feedCost?: number;
  observation?: string;
}

interface CreateFeedProductDto {
  name: string
  priceKg?: number
  bagWeightKg?: number
  active?: boolean
}

export function useFeedProducts() {
  return useQuery<FeedProduct[]>({
    queryKey: ['feed-products'],
    queryFn: async () => {
      const { data } = await api.get('/v1/feed-products');
      return data;
    },
  });
}

export function useFeedingTable(params: FeedingTableParams) {
  return useQuery<FeedingTableResponse>({
    queryKey: ['feeding', 'table', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/feeding/table', { params });
      return data;
    },
  });
}

export function useFeedingList(params: FeedingListParams) {
  return useQuery<{ items: FeedingRecord[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['feeding', 'list', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/feeding', { params });
      return data;
    },
  });
}

/**
 * Feed consumed in a window, not since the start of the cycle — the
 * lifetime-accumulated total (`useBiometricKpis`'s `racaoConsumidaKg`) is
 * correct for FCA, but wrong as an input to a same-day reverse estimate
 * (biomass from feed ÷ today's expected consumption rate): the rate falls a
 * lot over a cycle, so dividing a multi-week total by today's low rate
 * inflates the estimate the longer the cycle runs. Pass a short `from`/`to`
 * window (e.g. the last 7 days) so the rate stays valid for the feed it's
 * dividing.
 */
export function useFeedingAggregate(cycleId: string | null, params: { from?: string; to?: string } = {}) {
  return useQuery<FeedingAggregate>({
    queryKey: ['feeding', 'aggregate', cycleId, params],
    enabled: Boolean(cycleId),
    queryFn: async () => {
      const { data } = await api.get('/v1/feeding/aggregate', { params: { cycleId, ...params } });
      return data;
    },
  });
}

export function useFcaSeries(cycleId: string | null) {
  return useQuery<FcaSeries>({
    queryKey: ['feeding', 'fca-series', cycleId],
    enabled: Boolean(cycleId),
    queryFn: async () => {
      const { data } = await api.get('/v1/feeding/fca-series', { params: { cycleId } });
      return data;
    },
  });
}

export function useCreateExpressFeeding() {
  const qc = useQueryClient();
  return useMutation<FeedingRecord, Error, CreateExpressFeedingDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/feeding/express', dto);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['feeding'] });
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['biometrics', 'kpis', variables.cycleId] });
    },
  });
}

export function useCreateFeedProduct() {
  const qc = useQueryClient()
  return useMutation<FeedProduct, Error, CreateFeedProductDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/feed-products', dto)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-products'] })
    },
  })
}
