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
})
