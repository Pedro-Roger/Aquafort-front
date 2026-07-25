import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ConsumptionPoint {
  date: string;
  feedKg: number;
  /** Running total of feed offered up to this day. */
  accumulatedKg: number;
  /** Only filled on the days a biometric was taken. */
  averageWeightG: number | null;
}

export interface ConsumptionSeries {
  pondId: string;
  pondCode: string;
  points: ConsumptionPoint[];
}

interface Params {
  pondIds: string[];
  from?: string;
  to?: string;
}

export function useConsumptionSeries({ pondIds, from, to }: Params) {
  return useQuery<ConsumptionSeries[]>({
    queryKey: ['feeding', 'consumption-series', pondIds, from, to],
    enabled: pondIds.length > 0,
    queryFn: async () => {
      const { data } = await api.get('/v1/feeding/consumption-series', {
        params: { pondIds: pondIds.join(','), from, to },
      });
      return data;
    },
  });
}
