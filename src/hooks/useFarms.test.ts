import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const useMutationMock = vi.fn()
const useQueryMock = vi.fn()
const getMock = vi.fn()
const postMock = vi.fn()
const patchMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../lib/api', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}))

describe('useFarms', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    getMock.mockReset()
  })

  it('walks every page of /v1/farms', async () => {
    let queryFn: (() => Promise<unknown>) | undefined
    useQueryMock.mockImplementation((config: { queryFn: () => Promise<unknown> }) => {
      queryFn = config.queryFn
      return { data: undefined }
    })

    const pageOf = (page: number, size: number) =>
      Array.from({ length: size }, (_, i) => ({ id: `farm-${(page - 1) * size + i}` }))

    getMock.mockImplementation((_url: string, config: { params: { page: number } }) => {
      const page = config.params.page
      return Promise.resolve({ data: { data: pageOf(page, 100), total: 150, totalPages: 2 } })
    })

    const { useFarms } = await import('./useFarms')
    useFarms()

    const result = await queryFn!()

    expect(getMock).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(200)
  })
})

describe('useCreateFarm', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
    postMock.mockReset()
  })

  it('invalidates the farms list after create succeeds', async () => {
    let capturedConfig: { mutationFn: (dto: unknown) => Promise<unknown>; onSuccess?: () => void } | undefined
    useMutationMock.mockImplementation((config: typeof capturedConfig) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })
    postMock.mockResolvedValue({ data: { id: 'f1', name: 'Fazenda Norte' } })

    const { useCreateFarm } = await import('./useFarms')
    useCreateFarm()

    await capturedConfig!.mutationFn({ name: 'Fazenda Norte' })
    capturedConfig!.onSuccess?.()

    expect(postMock).toHaveBeenCalledWith('/v1/farms', { name: 'Fazenda Norte' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['farms'] })
  })
})

describe('useUpdateFarm', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    useMutationMock.mockReset()
    patchMock.mockReset()
  })

  it('sends PATCH without cnpj/legalName and invalidates the list', async () => {
    let capturedConfig: { mutationFn: (args: { id: string; data: unknown }) => Promise<unknown>; onSuccess?: () => void } | undefined
    useMutationMock.mockImplementation((config: typeof capturedConfig) => {
      capturedConfig = config
      return { mutateAsync: vi.fn() }
    })
    patchMock.mockResolvedValue({ data: { id: 'f1', name: 'Fazenda Norte II' } })

    const { useUpdateFarm } = await import('./useFarms')
    useUpdateFarm()

    await capturedConfig!.mutationFn({ id: 'f1', data: { name: 'Fazenda Norte II', status: 'INACTIVE' } })
    capturedConfig!.onSuccess?.()

    expect(patchMock).toHaveBeenCalledWith('/v1/farms/f1', { name: 'Fazenda Norte II', status: 'INACTIVE' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['farms'] })
  })
})
