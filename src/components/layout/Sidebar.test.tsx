import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { AuthContext } from '../../store/auth'
import { FarmContext } from '../../store/farm'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderSidebar(options: { isAdmin?: boolean; activeFarmId?: string } = {}) {
  const { isAdmin = false, activeFarmId = 'farm-1' } = options
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <FarmContext.Provider
          value={{
            farms: [{ farmId: 'farm-1', farmName: 'Fazenda Teste', role: 'ADMIN' }],
            farmsLoading: false,
            activeFarmId,
            activeFarmName: 'Fazenda Teste',
            activeFarmRole: 'ADMIN',
            isSwitchingFarm: false,
            switchFarm: async () => {},
          }}
        >
          <AuthContext.Provider
            value={{
              token: 't',
              refreshToken: 'r',
              user: {
                id: 'u1',
                name: isAdmin ? 'Pedro' : 'Op',
                email: 'op@aq.com',
                role: 'ADMIN',
                createdAt: '2026-01-01',
              },
              isAuthenticated: true,
              isAdmin,
              isTecnico: false,
              isOperador: !isAdmin,
              setAuth: () => {},
              clearAuth: () => {},
            }}
          >
            <Sidebar />
          </AuthContext.Provider>
        </FarmContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('shows operational navigation labels', () => {
    renderSidebar({ isAdmin: false })

    expect(screen.getByText('Viveiros')).toBeInTheDocument()
    expect(screen.getByText('Povoamento')).toBeInTheDocument()
    expect(screen.getByText('Transferência')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByAltText('Aquafort')).toBeInTheDocument()
    expect(screen.queryByText('Gestão operacional')).not.toBeInTheDocument()
  })

  it('groups the navigation into the sections defined by Pedro', () => {
    renderSidebar({ isAdmin: false })

    expect(screen.getByText('VISÃO GERAL')).toBeInTheDocument()
    expect(screen.getByText('PRODUÇÃO')).toBeInTheDocument()
    expect(screen.getByText('MANEJO')).toBeInTheDocument()
    expect(screen.getByText('ANÁLISES')).toBeInTheDocument()
    expect(screen.getByText('EQUIPE')).toBeInTheDocument()
  })

  it('hides Despesca from the navigation without removing the other items', () => {
    renderSidebar({ isAdmin: false })

    // Decisão do Pedro (2026-08-16): esconder, não remover — rota/lógica intactas.
    expect(screen.queryByText('Despesca')).not.toBeInTheDocument()
    // Vizinhos do mesmo grupo (MANEJO) continuam visíveis.
    expect(screen.getByText('Biometrias')).toBeInTheDocument()
    expect(screen.getByText('Qualidade')).toBeInTheDocument()
  })

  it('keeps Materiais, Relatórios and Configurações reachable even though they are outside the requested groups', () => {
    renderSidebar({ isAdmin: false })

    expect(screen.getByText('Materiais')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('hides the ADMIN group entirely from a non-admin user', () => {
    renderSidebar({ isAdmin: false })

    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    expect(screen.queryByText('Fazendas')).not.toBeInTheDocument()
    expect(screen.queryByText('Vínculos')).not.toBeInTheDocument()
  })

  it('shows Fazendas and Vínculos to an admin user (RN-04)', () => {
    renderSidebar({ isAdmin: true })

    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Fazendas')).toBeInTheDocument()
    expect(screen.getByText('Vínculos')).toBeInTheDocument()
  })
})