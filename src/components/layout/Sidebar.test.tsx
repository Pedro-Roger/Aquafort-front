import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AuthContext } from '../../store/auth'

describe('Sidebar', () => {
  it('shows operational navigation labels', () => {
    render(
      <MemoryRouter>
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
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Viveiros')).toBeInTheDocument()
    expect(screen.getByText('Povoamento')).toBeInTheDocument()
    expect(screen.getByText('Transferência')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByAltText('Aquafort')).toBeInTheDocument()
    expect(screen.queryByText('Gestão operacional')).not.toBeInTheDocument()
  })

  it('groups the navigation into the sections defined by Pedro', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            token: 't',
            refreshToken: 'r',
            user: { id: 'u1', name: 'Op', email: 'op@aq.com', role: 'OPERADOR', createdAt: '2026-01-01' },
            isAuthenticated: true,
            isAdmin: false,
            isTecnico: false,
            isOperador: true,
            setAuth: () => {},
            clearAuth: () => {},
          }}
        >
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('VISÃO GERAL')).toBeInTheDocument()
    expect(screen.getByText('PRODUÇÃO')).toBeInTheDocument()
    expect(screen.getByText('MANEJO')).toBeInTheDocument()
    expect(screen.getByText('ANÁLISES')).toBeInTheDocument()
    expect(screen.getByText('EQUIPE')).toBeInTheDocument()
  })

  it('hides Despesca from the navigation without removing the other items', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            token: 't',
            refreshToken: 'r',
            user: { id: 'u1', name: 'Op', email: 'op@aq.com', role: 'OPERADOR', createdAt: '2026-01-01' },
            isAuthenticated: true,
            isAdmin: false,
            isTecnico: false,
            isOperador: true,
            setAuth: () => {},
            clearAuth: () => {},
          }}
        >
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    // Decisão do Pedro (2026-08-16): esconder, não remover — rota/lógica intactas.
    expect(screen.queryByText('Despesca')).not.toBeInTheDocument()
    // Vizinhos do mesmo grupo (MANEJO) continuam visíveis.
    expect(screen.getByText('Biometrias')).toBeInTheDocument()
    expect(screen.getByText('Qualidade')).toBeInTheDocument()
  })

  it('keeps Materiais, Relatórios and Configurações reachable even though they are outside the requested groups', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            token: 't',
            refreshToken: 'r',
            user: { id: 'u1', name: 'Op', email: 'op@aq.com', role: 'OPERADOR', createdAt: '2026-01-01' },
            isAuthenticated: true,
            isAdmin: false,
            isTecnico: false,
            isOperador: true,
            setAuth: () => {},
            clearAuth: () => {},
          }}
        >
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Materiais')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })
})
