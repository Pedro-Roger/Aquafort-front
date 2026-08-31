import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SidebarVisibility {
  id: string;
  hiddenModules: string[];
  farmId: string;
  updatedBy: string | null;
  updatedAt: string;
}

export function useSidebarVisibility(farmId: string | null) {
  return useQuery<SidebarVisibility>({
    queryKey: ['sidebar-visibility', farmId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/farm/sidebar`);
      return data;
    },
    enabled: !!farmId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSidebarVisibility() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { farmId: string; hiddenModules: string[] }>({
    mutationFn: async ({ hiddenModules }) => {
      await api.put(`/v1/farm/sidebar`, { hiddenModules });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['sidebar-visibility', variables.farmId] });
    },
  });
}