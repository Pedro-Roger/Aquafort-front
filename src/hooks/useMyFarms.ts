import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '../types';

export type FarmMembershipStatus = 'ACTIVE' | 'INACTIVE';

/** GET /v1/me/farms — RF-05, alimenta o seletor de fazenda no header. */
export interface MyFarm {
  farmId: string;
  farmName: string;
  role: UserRole;
  status: FarmMembershipStatus;
}

export function useMyFarms(enabled = true) {
  return useQuery<MyFarm[]>({
    queryKey: ['me', 'farms'],
    queryFn: async () => {
      const { data } = await api.get('/v1/me/farms');
      return data;
    },
    enabled,
  });
}

export interface SwitchFarmResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  farmId: string;
  role: UserRole;
  farmStatus: FarmMembershipStatus;
}

/**
 * POST /v1/auth/switch-farm — troca o token para a fazenda escolhida.
 *
 * Só cuida da chamada à API: com o header X-Farm-Id em toda requisição de
 * domínio, qualquer dado já carregado é da fazenda anterior, então precisa
 * recarregar tudo — mas essa invalidação total do cache é feita uma única
 * vez, em `FarmProvider.switchFarm` (store/farm.tsx), depois de persistir o
 * novo token/fazenda em localStorage. Persistir o token e invalidar o cache
 * são responsabilidade de quem chama (FarmProvider), pra manter este hook
 * livre de efeito colateral fora do React Query e evitar invalidar duas
 * vezes a cada troca de fazenda.
 */
export function useSwitchFarm() {
  return useMutation<SwitchFarmResult, Error, string>({
    mutationFn: async (farmId) => {
      const { data } = await api.post('/v1/auth/switch-farm', { farmId });
      return data;
    },
  });
}
