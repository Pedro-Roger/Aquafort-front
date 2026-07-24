import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateHarvestDto, HarvestRecord, OperationalReportsQuery, OperationalReportsResponse } from '../types';

export function useOperationalReports(query: OperationalReportsQuery = {}) {
  return useQuery<OperationalReportsResponse>({
    queryKey: ['operational-reports', query],
    queryFn: async () => (await api.get('/v1/operational-reports', { params: query })).data,
  });
}

export function useExportOperationalReports() {
  return useMutation<void, Error, OperationalReportsQuery>({
    mutationFn: async (query) => {
      const response = await api.get('/v1/operational-reports/export', {
        params: query,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type:
          (response.headers['content-type'] as string | undefined) ??
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'relatorio-operacional.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useCreateHarvestRecord() {
  const qc = useQueryClient();
  return useMutation<HarvestRecord, Error, CreateHarvestDto>({
    mutationFn: async (dto) => (await api.post('/v1/operational-reports/harvests', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational-reports'] });
      qc.invalidateQueries({ queryKey: ['harvest-projection'] });
    },
  });
}
