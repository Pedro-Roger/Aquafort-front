import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/queryClient';
import { AuthContext } from './store/auth';

vi.mock('./hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.4 },
      { id: 'p2', code: 'V-02', name: 'Viveiro 02', status: 'PREPARANDO', type: 'ENGORDA', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}));

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Op',
      email: 'op@aq.com',
      role: 'OPERADOR',
      createdAt: '2026-01-01',
    },
    isAuthenticated: true,
    clearAuth: vi.fn(),
  }),
}));

vi.mock('./hooks/useCycles', () => ({
  useCycles: () => ({ data: [], isLoading: false }),
}));

vi.mock('./hooks/useHarvestProjection', () => ({
  useHarvestProjection: () => ({ data: undefined, isLoading: false }),
  useRecomputeHarvestProjection: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('App routing', () => {
  it('opens the transfer page at /transferencia', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            token: 't',
            refreshToken: 'r',
            user: {
              id: 'u1',
              name: 'Op',
              email: 'op@aq.com',
              role: 'OPERADOR',
              createdAt: '2026-01-01',
            },
            isAuthenticated: true,
            isAdmin: false,
            isTecnico: false,
            isOperador: true,
            setAuth: () => {},
            clearAuth: () => {},
          }}
        >
          <MemoryRouter initialEntries={['/transferencia']}>
            <App />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Registrar transferência')).toBeInTheDocument();
    expect(
      screen.getByText('Movimente lotes entre viveiros — o ciclo de destino é garantido automaticamente.'),
    ).toBeInTheDocument();
  });

  it('keeps /despesca routed and functional even though it is hidden from the sidebar', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            token: 't',
            refreshToken: 'r',
            user: {
              id: 'u1',
              name: 'Op',
              email: 'op@aq.com',
              role: 'OPERADOR',
              createdAt: '2026-01-01',
            },
            isAuthenticated: true,
            isAdmin: false,
            isTecnico: false,
            isOperador: true,
            setAuth: () => {},
            clearAuth: () => {},
          }}
        >
          <MemoryRouter initialEntries={['/despesca']}>
            <App />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Painel de despesca')).toBeInTheDocument();
  });
});
