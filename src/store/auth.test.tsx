import { useContext } from 'react'
import { act, renderHook } from '@testing-library/react'
import { AuthContext, AuthProvider } from './auth'

describe('AuthProvider', () => {
  it('persists role from login payload', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useContext(AuthContext), { wrapper })

    act(() => {
      result.current.setAuth('token', 'refresh', {
        id: 'u1',
        name: 'Pedro',
        email: 'pedro@aq.com',
        role: 'TECNICO',
        createdAt: '2026-01-01',
      })
    })

    expect(result.current.user?.role).toBe('TECNICO')
  })
})
