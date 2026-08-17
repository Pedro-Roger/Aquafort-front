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
  /**
   * RF-13/plano técnico de unificação (viveiros-e-ciclos/spec.md): peso
   * médio (g) já convertido no cliente, nunca PL/grama cru. Opcional — vira
   * biometria de fechamento no ciclo de origem e `plPerGram` no ciclo de
   * destino quando informado.
   */
  averageWeightG?: number;
  /**
   * RF-21: decisão explícita do operador se esta transferência encerra o
   * ciclo de origem. Ausente = backend aplica o default (quantity >= população
   * restante).
   */
  closesOriginCycle?: boolean;
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
