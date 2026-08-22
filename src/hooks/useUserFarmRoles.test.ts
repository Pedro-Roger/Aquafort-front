import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const useMutationMock = vi.fn()
const postMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../lib/api', () => ({
  api: {
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}))

describe('useLinkUserFarmRole', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
    postMock.mockReset()
  })

  it('links a user with a role to a farm', async () => {
    let capturedConfig: { mutationFn: (dto: unknown) => Promise<unknown>; onSuccess?: () => void } | undefined
    useMutationMock.mockImplementation((config: typeof capturedConfig) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })
    postMock.mockResolvedValue({ data: { id: 'ufr1' } })

    const { useLinkUserFarmRole } = await import('./useUserFarmRoles')
    useLinkUserFarmRole()

    await capturedConfig!.mutationFn({ farmId: 'f1', userId: 'u1', role: 'TECNICO' })
    capturedConfig!.onSuccess?.()

    expect(postMock).toHaveBeenCalledWith('/v1/farms/f1/users', { userId: 'u1', role: 'TECNICO' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['farms'] })
  })
})

describe('useUnlinkUserFarmRole', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
    deleteMock.mockReset()
  })

  it('unlinks a user from a farm', async () => {
    let capturedConfig: { mutationFn: (dto: unknown) => Promise<unknown>; onSuccess?: () => void } | undefined
    useMutationMock.mockImplementation((config: typeof capturedConfig) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })
    deleteMock.mockResolvedValue({})

    const { useUnlinkUserFarmRole } = await import('./useUserFarmRoles')
    useUnlinkUserFarmRole()

    await capturedConfig!.mutationFn({ farmId: 'f1', userId: 'u1' })
    capturedConfig!.onSuccess?.()

    expect(deleteMock).toHaveBeenCalledWith('/v1/farms/f1/users/u1')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['farms'] })
  })
})
