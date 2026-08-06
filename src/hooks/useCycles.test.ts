import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.fn()
const useMutationMock = vi.fn()
const invalidateQueries = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    post: (...args: unknown[]) => postMock(...args),
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries }),
}))

describe('useCreateCycle', () => {
  beforeEach(() => {
    postMock.mockReset()
    useMutationMock.mockReset()
    invalidateQueries.mockReset()
    vi.resetModules()
  })

  it('maps initialPhase to phase and normalizes stockDate before posting', async () => {
    let mutationConfig: { mutationFn: (dto: any) => Promise<unknown> } | undefined

    useMutationMock.mockImplementation((config: { mutationFn: (dto: any) => Promise<unknown> }) => {
      mutationConfig = config
      return { mutateAsync: vi.fn() }
    })

    postMock.mockResolvedValue({ data: {} })

    const { useCreateCycle } = await import('./useCycles')
    useCreateCycle()

    await mutationConfig!.mutationFn({
      pondId: 'pond-1',
      supplier: 'Lavifort',
      stockDate: '2026-07-05',
      plCount: 342000,
      initialPhase: 'ENGORDA',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/v1/cycles',
      expect.objectContaining({
        pondId: 'pond-1',
        supplier: 'Lavifort',
        stockDate: '2026-07-05T00:00:00.000Z',
        plCount: 342000,
        phase: 'ENGORDA',
      }),
    )
  })

  it('includes origins in the payload when provided', async () => {
    let mutationConfig: { mutationFn: (dto: any) => Promise<unknown> } | undefined

    useMutationMock.mockImplementation((config: { mutationFn: (dto: any) => Promise<unknown> }) => {
      mutationConfig = config
      return { mutateAsync: vi.fn() }
    })

    postMock.mockResolvedValue({ data: {} })

    const { useCreateCycle } = await import('./useCycles')
    useCreateCycle()

    await mutationConfig!.mutationFn({
      pondId: 'pond-1',
      supplier: 'Lavifort',
      stockDate: '2026-07-05',
      plCount: 342000,
      initialPhase: 'ENGORDA',
      origins: [{ label: 'Berçário 124', sourceCycleId: 'cycle-1', quantity: 200_000 }],
    })

    expect(postMock).toHaveBeenCalledWith(
      '/v1/cycles',
      expect.objectContaining({
        origins: [{ label: 'Berçário 124', sourceCycleId: 'cycle-1', quantity: 200_000 }],
      }),
    )
  })

  it('omits origins from the payload when not provided', async () => {
    let mutationConfig: { mutationFn: (dto: any) => Promise<unknown> } | undefined

    useMutationMock.mockImplementation((config: { mutationFn: (dto: any) => Promise<unknown> }) => {
      mutationConfig = config
      return { mutateAsync: vi.fn() }
    })

    postMock.mockResolvedValue({ data: {} })

    const { useCreateCycle } = await import('./useCycles')
    useCreateCycle()

    await mutationConfig!.mutationFn({
      pondId: 'pond-1',
      supplier: 'Lavifort',
      stockDate: '2026-07-05',
      plCount: 342000,
      initialPhase: 'ENGORDA',
    })

    const [, payload] = postMock.mock.calls[0]
    expect(payload).not.toHaveProperty('origins')
  })
})
