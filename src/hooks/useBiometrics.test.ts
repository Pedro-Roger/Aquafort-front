import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.fn()
const deleteMock = vi.fn()
const useMutationMock = vi.fn()
const invalidateQueries = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
    get: vi.fn(),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries }),
}))

describe('useBiometrics invalidation', () => {
  beforeEach(() => {
    postMock.mockReset()
    deleteMock.mockReset()
    useMutationMock.mockReset()
    invalidateQueries.mockReset()
    vi.resetModules()
  })

  // Regression: the pond grid cards (useLatestBiometricsByPond) read from
  // ['biometrics', 'latest-by-pond'], a query onSuccess never invalidated —
  // a card kept showing "Nenhuma leitura registrada" after a real save,
  // until something else happened to trigger a refetch.
  it('useCreateBiometric invalidates latest-by-pond alongside the per-cycle queries', async () => {
    let onSuccess: ((data: { cycleId: string }) => void) | undefined

    useMutationMock.mockImplementation((config: { onSuccess?: typeof onSuccess }) => {
      onSuccess = config.onSuccess
      return { mutateAsync: vi.fn() }
    })

    const { useCreateBiometric } = await import('./useBiometrics')
    useCreateBiometric()

    onSuccess!({ cycleId: 'cycle-1' })

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'cycle-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'series', 'cycle-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'kpis', 'cycle-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cycles', 'cycle-1', 'growth-chart'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'latest-by-pond'] })
  })

  it('useDeleteBiometric invalidates latest-by-pond alongside the per-cycle queries', async () => {
    let onSuccess: ((_: unknown, vars: { id: string; cycleId: string }) => void) | undefined

    useMutationMock.mockImplementation((config: { onSuccess?: typeof onSuccess }) => {
      onSuccess = config.onSuccess
      return { mutate: vi.fn() }
    })

    const { useDeleteBiometric } = await import('./useBiometrics')
    useDeleteBiometric()

    onSuccess!(undefined, { id: 'bio-1', cycleId: 'cycle-1' })

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'cycle-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['biometrics', 'latest-by-pond'] })
  })
})
