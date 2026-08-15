import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreatePond } from './usePonds'

const invalidateQueries = vi.fn()
const useMutationMock = vi.fn()
const useQueryMock = vi.fn()
const getMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: (...args: unknown[]) => getMock(...args),
  },
}))

describe('usePonds', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    getMock.mockReset()
    vi.resetModules()
  })

  it('walks every page instead of returning just the first 20 ponds', async () => {
    let queryFn: (() => Promise<unknown>) | undefined
    useQueryMock.mockImplementation((config: { queryFn: () => Promise<unknown> }) => {
      queryFn = config.queryFn
      return { data: undefined }
    })

    // A 64-pond farm split across four pages of 16, mirroring the API's
    // own pagination shape — this is the exact case that used to get
    // silently truncated to whatever fit on page 1.
    const pageOf = (page: number, size: number) =>
      Array.from({ length: size }, (_, i) => ({ id: `pond-${(page - 1) * size + i}` }))

    getMock.mockImplementation((_url: string, config: { params: { page: number } }) => {
      const page = config.params.page
      return Promise.resolve({
        data: { data: pageOf(page, 16), total: 64, totalPages: 4 },
      })
    })

    const { usePonds } = await import('./usePonds')
    usePonds()

    const result = await queryFn!()

    expect(getMock).toHaveBeenCalledTimes(4)
    expect(result).toHaveLength(64)
  })

  it('does not fetch further pages when everything fits on the first one', async () => {
    let queryFn: (() => Promise<unknown>) | undefined
    useQueryMock.mockImplementation((config: { queryFn: () => Promise<unknown> }) => {
      queryFn = config.queryFn
      return { data: undefined }
    })

    getMock.mockResolvedValue({ data: { data: [{ id: 'pond-1' }], total: 1, totalPages: 1 } })

    const { usePonds } = await import('./usePonds')
    usePonds()

    const result = await queryFn!()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual([{ id: 'pond-1' }])
  })
})

describe('useCreatePond', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
  })

  it('invalidates both pond list and pond canvas after create succeeds', () => {
    let capturedConfig: { onSuccess?: () => void } | undefined

    useMutationMock.mockImplementation((config: { onSuccess?: () => void }) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })

    useCreatePond()
    capturedConfig?.onSuccess?.()

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['ponds'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['ponds', 'canvas'] })
  })
})
