import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '../types';

/**
 * Vínculos usuário-fazenda (RN-04, admin global).
 *
 * O backend (aquafort-api, commit 686d9caa) só expõe `POST /v1/farms/:farmId/users`
 * e `DELETE /v1/farms/:farmId/users/:userId` — não existe endpoint pra listar
 * os vínculos já existentes de uma fazenda. Por isso este arquivo só tem
 * link/unlink; a UserFarmRolesPage não consegue mostrar quem já está
 * vinculado, apenas vincular/desvincular. Sinalizado no relatório final —
 * falta um `GET /v1/farms/:farmId/users` no backend.
 */

export interface LinkUserFarmRoleDto {
  farmId: string;
  userId: string;
  role: UserRole;
}

export function useLinkUserFarmRole() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, LinkUserFarmRoleDto>({
    mutationFn: async ({ farmId, userId, role }) => {
      const { data } = await api.post(`/v1/farms/${farmId}/users`, { userId, role });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  });
}

export interface UnlinkUserFarmRoleDto {
  farmId: string;
  userId: string;
}

export function useUnlinkUserFarmRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, UnlinkUserFarmRoleDto>({
    mutationFn: async ({ farmId, userId }) => {
      await api.delete(`/v1/farms/${farmId}/users/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  });
}
