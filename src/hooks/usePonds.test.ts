import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreatePond } from './usePonds'

const invalidateQueries = vi.fn()
const useMutationMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

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
