import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type FarmStatus = 'ACTIVE' | 'INACTIVE';

export interface Farm {
  id: string;
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  location?: string | null;
  totalHa?: number | null;
  timezone: string;
  status: FarmStatus;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * GET /v1/farms — admin global (RN-04). Pagina como os demais endpoints
 * (limite máximo 100/página); percorre todas as páginas do mesmo jeito que
 * usePonds, já que a tela de administração quer o cadastro completo.
 */
export function useFarms() {
  return useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: async () => {
      const first = await api.get<PaginatedResult<Farm>>('/v1/farms', { params: { page: 1, limit: 100 } });
      const farms = first.data.data ?? [];
      const totalPages = first.data.totalPages ?? 1;

      if (totalPages <= 1) return farms;

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          api.get<PaginatedResult<Farm>>('/v1/farms', { params: { page: index + 2, limit: 100 } }),
        ),
      );

      return [...farms, ...rest.flatMap((response) => response.data.data)];
    },
  });
}

export interface CreateFarmDto {
  name: string;
  legalName?: string;
  cnpj?: string;
  location?: string;
  totalHa?: number;
  timezone?: string;
}

/**
 * PATCH /v1/farms/:id não aceita `cnpj`/`legalName` — decisão do backend
 * (dado cadastral/legal, só definido na criação). O formulário de edição não
 * deve nem oferecer esses campos.
 */
export interface UpdateFarmDto {
  name?: string;
  location?: string;
  totalHa?: number;
  timezone?: string;
  status?: FarmStatus;
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation<Farm, Error, CreateFarmDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/farms', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation<Farm, Error, { id: string; data: UpdateFarmDto }>({
    mutationFn: async ({ id, data }) => {
      const { data: response } = await api.patch(`/v1/farms/${id}`, data);
      return response;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  });
}
