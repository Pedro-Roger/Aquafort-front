import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPost = vi.spyOn(axios, 'post')

describe('api refresh interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPost.mockReset()
    vi.resetModules()
  })

  it('stores both new access token and new refresh token after refresh', async () => {
    localStorage.setItem('aquafort_refresh', 'old-refresh')

    mockPost.mockResolvedValueOnce({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      },
    } as any)

    const { api } = await import('./api')
    const rejected = (api.interceptors.response as any).handlers[0].rejected

    const error = {
      config: {
        _retry: false,
        headers: {},
      },
      response: {
        status: 401,
      },
    }

    await rejected(error).catch(() => undefined)

    expect(localStorage.getItem('aquafort_token')).toBe('new-access')
    expect(localStorage.getItem('aquafort_refresh')).toBe('new-refresh')
  })
})
