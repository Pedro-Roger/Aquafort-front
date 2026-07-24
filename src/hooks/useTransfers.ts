import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PondTransfer } from '../types';

interface TransfersParams {
  pondId?: string | null;
}

export interface CreateTransferDto {
  fromPondId: string;
  toPondId: string;
  quantity: number;
  transferredAt: string;
  responsible: string;
  reason?: string;
  note?: string;
}

export function useTransfers(params: TransfersParams = {}) {
  return useQuery<PondTransfer[]>({
    queryKey: ['transfers', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/transfers', { params });
      return data;
    },
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation<PondTransfer, Error, CreateTransferDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/transfers', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/v1/transfers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}
