import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { User } from '../types';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * GET /v1/users — admin global. Usado pela tela de vínculos usuário-fazenda
 * pra alimentar o seletor de usuário; percorre a paginação do mesmo jeito
 * que usePonds/useFarms.
 */
export function useUsers(enabled = true) {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const first = await api.get<PaginatedResult<User>>('/v1/users', { params: { page: 1, limit: 100 } });
      const users = first.data.data ?? [];
      const totalPages = first.data.totalPages ?? 1;

      if (totalPages <= 1) return users;

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          api.get<PaginatedResult<User>>('/v1/users', { params: { page: index + 2, limit: 100 } }),
        ),
      );

      return [...users, ...rest.flatMap((response) => response.data.data)];
    },
    enabled,
  });
}
