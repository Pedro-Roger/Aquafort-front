import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DashboardConfig, DashboardMetric, DashboardPanel, MetricSeries } from '../types';

export function useDashboardMetrics() {
  return useQuery<DashboardMetric[]>({
    queryKey: ['dashboards', 'metrics'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get('/v1/dashboards/metrics');
      return data;
    },
  });
}

export function useMetricSeries(panel: Pick<DashboardPanel, 'metric' | 'pondIds' | 'from' | 'to' | 'xAxis'> | null) {
  return useQuery<MetricSeries[]>({
    queryKey: ['dashboards', 'series', panel],
    enabled: Boolean(panel?.metric),
    queryFn: async () => {
      const { data } = await api.get('/v1/dashboards/series', {
        params: {
          metric: panel!.metric,
          pondIds: panel!.pondIds.length ? panel!.pondIds.join(',') : undefined,
          from: panel!.from || undefined,
          to: panel!.to || undefined,
          xAxis: panel!.xAxis ?? 'date',
        },
      });
      return data;
    },
  });
}

export function useDashboards() {
  return useQuery<DashboardConfig[]>({
    queryKey: ['dashboards', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/v1/dashboards');
      return data;
    },
  });
}

export function useSaveDashboard() {
  const qc = useQueryClient();
  return useMutation<DashboardConfig, Error, { id?: string; name: string; panels: DashboardPanel[] }>({
    mutationFn: async ({ id, ...dto }) => {
      const { data } = id
        ? await api.put(`/v1/dashboards/${id}`, dto)
        : await api.post('/v1/dashboards', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboards', 'list'] });
    },
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/v1/dashboards/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboards', 'list'] });
    },
  });
}
