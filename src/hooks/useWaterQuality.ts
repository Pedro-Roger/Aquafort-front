import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { connectWaterQualitySocket, disconnectWaterQualitySocket, getWaterQualitySocket } from '../lib/socket';
import type { WaterQuality } from '../types';

export interface WaterQualityPoint {
  date: string;
  value: number;
}

export interface WaterQualitySeries {
  doMgL: WaterQualityPoint[];
  ph: WaterQualityPoint[];
  salinity: WaterQualityPoint[];
  temperatureC: WaterQualityPoint[];
  ammoniaMgL: WaterQualityPoint[];
}

export function useWaterQualitySeries(cycleId: string | null) {
  return useQuery<WaterQualitySeries>({
    queryKey: ['water-quality', 'series', cycleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/water-quality/series?cycleId=${cycleId}`);
      return data;
    },
    enabled: !!cycleId,
  });
}

export function useWaterQuality(cycleId?: string) {
  return useQuery<WaterQuality[]>({
    queryKey: ['water-quality', cycleId],
    queryFn: async () => {
      const { data } = await api.get('/v1/water-quality', { params: { cycleId } });
      return (data as { data?: WaterQuality[] })?.data ?? [];
    },
    enabled: !!cycleId,
  });
}

interface CreateWaterQualityDto {
  cycleId: string;
  oxygenMgL: number;
  ph: number;
  salinityPpt: number;
  temperatureC: number;
  ammoniaMgL: number;
  responsibleId?: string;
}

export function useCreateWaterQuality() {
  const qc = useQueryClient();
  return useMutation<WaterQuality, Error, CreateWaterQualityDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/v1/water-quality', dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['water-quality', variables.cycleId] });
    },
  });
}

export function useWaterQualitySocket(cycleId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!cycleId) return;

    connectWaterQualitySocket();
    const socket = getWaterQualitySocket();

    socket.emit('subscribe', { cycleId });

    const handleNewMeasurement = (measurement: WaterQuality) => {
      qc.setQueryData<WaterQuality[]>(['water-quality', cycleId], (old = []) => {
        const exists = old.some((m) => m.id === measurement.id);
        if (exists) return old;
        return [measurement, ...old];
      });
    };

    socket.on('newMeasurement', handleNewMeasurement);

    return () => {
      socket.emit('unsubscribe', { cycleId });
      socket.off('newMeasurement', handleNewMeasurement);
      disconnectWaterQualitySocket();
    };
  }, [cycleId, qc]);
}
