import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const useMutationMock = vi.fn()
const useQueryMock = vi.fn()
const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../lib/api', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}))

describe('useMyFarms', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    getMock.mockReset()
  })

  it('fetches /v1/me/farms', async () => {
    let queryFn: (() => Promise<unknown>) | undefined
    useQueryMock.mockImplementation((config: { queryFn: () => Promise<unknown>; enabled?: boolean }) => {
      queryFn = config.queryFn
      return { data: undefined }
    })
    getMock.mockResolvedValue({ data: [{ farmId: 'f1', farmName: 'Fazenda 1', role: 'TECNICO', status: 'ACTIVE' }] })

    const { useMyFarms } = await import('./useMyFarms')
    useMyFarms()

    const result = await queryFn!()

    expect(getMock).toHaveBeenCalledWith('/v1/me/farms')
    expect(result).toEqual([{ farmId: 'f1', farmName: 'Fazenda 1', role: 'TECNICO', status: 'ACTIVE' }])
  })

  it('respects the enabled flag (no fetch before login resolves)', async () => {
    useQueryMock.mockImplementation((config: { enabled?: boolean }) => {
      expect(config.enabled).toBe(false)
      return { data: undefined }
    })

    const { useMyFarms } = await import('./useMyFarms')
    useMyFarms(false)
  })
})

describe('useSwitchFarm', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
    postMock.mockReset()
  })

  it('posts the chosen farm and does not invalidate the cache itself', async () => {
    let capturedConfig: { mutationFn: (farmId: string) => Promise<unknown>; onSuccess?: () => void } | undefined
    useMutationMock.mockImplementation((config: typeof capturedConfig) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })
    postMock.mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900, farmId: 'f2', role: 'OPERADOR', farmStatus: 'ACTIVE' },
    })

    const { useSwitchFarm } = await import('./useMyFarms')
    useSwitchFarm()

    const result = await capturedConfig!.mutationFn('f2')

    expect(postMock).toHaveBeenCalledWith('/v1/auth/switch-farm', { farmId: 'f2' })
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900, farmId: 'f2', role: 'OPERADOR', farmStatus: 'ACTIVE' })
    // A invalidação total do cache é feita uma única vez em FarmProvider.switchFarm
    // (store/farm.tsx) — duplicar aqui causava duas invalidações por troca de fazenda.
    expect(capturedConfig!.onSuccess).toBeUndefined()
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
