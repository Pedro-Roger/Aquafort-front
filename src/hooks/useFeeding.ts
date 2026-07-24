import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { FeedingRecord, FeedingTableResponse, FeedProduct } from '../types';

interface FeedingListParams {
  cycleId?: string | null;
  pondId?: string | null;
  page?: number;
  limit?: number;
}

interface FeedingTableParams {
  cycleId?: string | null;
  pondId?: string | null;
  date?: string;
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
