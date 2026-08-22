import type React from 'react'
import { useContext } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from './auth'
import { FarmContext, FarmProvider } from './farm'

const invalidateQueries = vi.fn()
const mutateAsync = vi.fn()
const useMyFarmsMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../hooks/useMyFarms', () => ({
  useMyFarms: (...args: unknown[]) => useMyFarmsMock(...args),
  useSwitchFarm: () => ({ mutateAsync, isPending: false }),
}))

const baseUser = { id: 'u1', name: 'Pedro', email: 'pedro@aq.com', role: 'TECNICO' as const, createdAt: '2026-01-01' }

function makeWrapper(authOverrides: Record<string, unknown> = {}) {
  const setAuth = vi.fn()
  const clearAuth = vi.fn()
  const authValue = {
    token: 't',
    refreshToken: 'r',
    user: baseUser,
    isAuthenticated: true,
    isAdmin: false,
    isTecnico: true,
    isOperador: false,
    setAuth,
    clearAuth,
    ...authOverrides,
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={authValue as never}>
      <FarmProvider>{children}</FarmProvider>
    </AuthContext.Provider>
  )

  return { setAuth, Wrapper }
}

describe('FarmProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    invalidateQueries.mockReset()
    mutateAsync.mockReset()
    useMyFarmsMock.mockReset()
  })

  it('derives the active farm name and effective role from the farm matching the persisted farm id', () => {
    localStorage.setItem('aquafort_active_farm_id', 'f2')
    useMyFarmsMock.mockReturnValue({
      data: [
        { farmId: 'f1', farmName: 'Fazenda Norte', role: 'OPERADOR', status: 'ACTIVE' },
        { farmId: 'f2', farmName: 'Fazenda Sul', role: 'TECNICO', status: 'ACTIVE' },
      ],
      isLoading: false,
    })

    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useContext(FarmContext), { wrapper: Wrapper })

    expect(result.current.activeFarmId).toBe('f2')
    expect(result.current.activeFarmName).toBe('Fazenda Sul')
    expect(result.current.activeFarmRole).toBe('TECNICO')
  })

  it('falls back to the first linked farm when the persisted id no longer belongs to the user (RN-02)', async () => {
    localStorage.setItem('aquafort_active_farm_id', 'orphan-farm')
    useMyFarmsMock.mockReturnValue({
      data: [{ farmId: 'f1', farmName: 'Fazenda Norte', role: 'OPERADOR', status: 'ACTIVE' }],
      isLoading: false,
    })

    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useContext(FarmContext), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.activeFarmId).toBe('f1'))
    expect(localStorage.getItem('aquafort_active_farm_id')).toBe('f1')
  })

  it('switching farm calls switch-farm, rotates the token pair, persists the new farm and invalidates the whole cache', async () => {
    useMyFarmsMock.mockReturnValue({
      data: [
        { farmId: 'f1', farmName: 'Fazenda Norte', role: 'OPERADOR', status: 'ACTIVE' },
        { farmId: 'f2', farmName: 'Fazenda Sul', role: 'TECNICO', status: 'ACTIVE' },
      ],
      isLoading: false,
    })
    mutateAsync.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      tokenType: 'Bearer',
      expiresIn: 900,
      farmId: 'f2',
      role: 'TECNICO',
      farmStatus: 'ACTIVE',
    })

    const { Wrapper, setAuth } = makeWrapper()
    const { result } = renderHook(() => useContext(FarmContext), { wrapper: Wrapper })

    await result.current.switchFarm('f2')

    expect(mutateAsync).toHaveBeenCalledWith('f2')
    expect(setAuth).toHaveBeenCalledWith('new-access', 'new-refresh', baseUser)
    expect(localStorage.getItem('aquafort_active_farm_id')).toBe('f2')
    // sem chave: todo dado carregado é da fazenda anterior, precisa recarregar tudo
    expect(invalidateQueries).toHaveBeenCalledWith()
  })

  it('clears the persisted farm on logout', () => {
    localStorage.setItem('aquafort_active_farm_id', 'f1')
    useMyFarmsMock.mockReturnValue({ data: [], isLoading: false })

    const { Wrapper } = makeWrapper({ isAuthenticated: false, user: null, token: null })
    const { result } = renderHook(() => useContext(FarmContext), { wrapper: Wrapper })

    expect(result.current.activeFarmId).toBeNull()
    expect(localStorage.getItem('aquafort_active_farm_id')).toBeNull()
  })
})
