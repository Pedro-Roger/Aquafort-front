import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Material, MaterialUnit, MaterialUsage } from '../types';

export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await api.get('/v1/materials');
      return data;
    },
  });
}

export function useMaterialUsages(pondId?: string | null) {
  return useQuery<MaterialUsage[]>({
    queryKey: ['materials', 'usages', pondId ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get('/v1/materials/usages', {
        params: pondId ? { pondId } : {},
      });
      return data;
    },
  });
}

interface CreateMaterialDto {
  name: string;
  unit: MaterialUnit;
  packageWeightKg?: number;
  unitPrice?: number;
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation<Material, Error, CreateMaterialDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/materials', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

interface RegisterUsageDto {
  pondId: string;
  materialId: string;
  quantity: number;
  usedAt: string;
  responsible?: string;
  note?: string;
}

export function useRegisterUsage() {
  const qc = useQueryClient();
  return useMutation<MaterialUsage, Error, RegisterUsageDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/materials/usages', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials', 'usages'] }),
  });
}
