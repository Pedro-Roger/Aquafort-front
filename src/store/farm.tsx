import React, { createContext, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACTIVE_FARM_KEY } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useMyFarms, useSwitchFarm, type MyFarm } from '../hooks/useMyFarms';
import type { UserRole } from '../types';

interface FarmState {
  /** Fazendas vinculadas ao usuário logado (GET /me/farms). */
  farms: MyFarm[];
  farmsLoading: boolean;
  activeFarmId: string | null;
  activeFarmName: string | null;
  /**
   * Papel efetivo do usuário NA fazenda ativa (RN-03) — não confundir com o
   * `role` global do JWT em `useAuth().user.role`, que pode divergir por
   * fazenda (técnico na A, operador na B).
   */
  activeFarmRole: UserRole | null;
  isSwitchingFarm: boolean;
  switchFarm: (farmId: string) => Promise<void>;
}

export const FarmContext = createContext<FarmState>({
  farms: [],
  farmsLoading: false,
  activeFarmId: null,
  activeFarmName: null,
  activeFarmRole: null,
  isSwitchingFarm: false,
  switchFarm: async () => {},
});

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setAuth } = useAuth();
  const qc = useQueryClient();
  const { data: farms = [], isLoading: farmsLoading } = useMyFarms(isAuthenticated);
  const switchFarmMutation = useSwitchFarm();

  /**
   * Fazenda ativa é derivada a cada render (nunca guardada num state
   * próprio) pra não precisar de um efeito só pra sincronizar
   * estado-com-estado: lê o valor persistido e, se ele não pertencer mais ao
   * usuário logado, cai pra primeira fazenda vinculada (RN-02 — cobre
   * primeiro login sem fazenda escolhida, sessão de outro usuário com uma
   * fazenda órfã sobrando no localStorage, e logout).
   */
  const activeFarmId = useMemo(() => {
    if (!isAuthenticated) return null;
    const persisted = localStorage.getItem(ACTIVE_FARM_KEY);
    if (farms.some((farm) => farm.farmId === persisted)) return persisted;
    return farms[0]?.farmId ?? null;
  }, [isAuthenticated, farms]);

  // Mantém o localStorage sincronizado com o valor resolvido acima — o
  // interceptor do axios (src/lib/api.ts) lê essa chave em toda requisição.
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(ACTIVE_FARM_KEY);
      return;
    }
    if (activeFarmId) {
      localStorage.setItem(ACTIVE_FARM_KEY, activeFarmId);
    }
  }, [isAuthenticated, activeFarmId]);

  const switchFarm = useCallback(
    async (farmId: string) => {
      const result = await switchFarmMutation.mutateAsync(farmId);

      if (user) {
        // O usuário (nome/email/role global) não muda ao trocar de fazenda —
        // só o par de tokens é rotacionado (novo JWT carrega os mesmos
        // farms/roles de sempre, só re-assinado).
        setAuth(result.accessToken, result.refreshToken, user);
      }

      localStorage.setItem(ACTIVE_FARM_KEY, farmId);

      // Todo dado carregado até aqui é da fazenda anterior — recarrega tudo.
      await qc.invalidateQueries();
    },
    [switchFarmMutation, user, setAuth, qc],
  );

  const active = farms.find((farm) => farm.farmId === activeFarmId) ?? null;

  return (
    <FarmContext.Provider
      value={{
        farms,
        farmsLoading,
        activeFarmId,
        activeFarmName: active?.farmName ?? null,
        activeFarmRole: active?.role ?? null,
        isSwitchingFarm: switchFarmMutation.isPending,
        switchFarm,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}
