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

describe('api refresh under concurrent 401s', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPost.mockReset()
    vi.resetModules()
  })

  function failedRequest() {
    return { config: { headers: {} }, response: { status: 401 } }
  }

  it('refreshes once when several requests fail at the same moment', async () => {
    localStorage.setItem('aquafort_refresh', 'old-refresh')
    mockPost.mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } } as any)

    const { api } = await import('./api')
    const rejected = (api.interceptors.response as any).handlers[0].rejected

    await Promise.all([
      rejected(failedRequest()).catch(() => undefined),
      rejected(failedRequest()).catch(() => undefined),
      rejected(failedRequest()).catch(() => undefined),
    ])

    // one rotation for the whole burst, not one per request
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('aquafort_token')).toBe('new-access')
  })

  it('keeps the session when a straggler 401 arrives after the refresh', async () => {
    localStorage.setItem('aquafort_refresh', 'old-refresh')
    mockPost.mockResolvedValueOnce({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } } as any)

    const { api } = await import('./api')
    const rejected = (api.interceptors.response as any).handlers[0].rejected

    await rejected(failedRequest()).catch(() => undefined)

    // a request that left before the refresh comes back carrying the old token
    mockPost.mockRejectedValueOnce(new Error('refresh token já rotacionado'))
    const straggler = { config: { headers: { Authorization: 'Bearer old-access' } }, response: { status: 401 } }
    await rejected(straggler).catch(() => undefined)

    // the session was already renewed — the straggler must not wipe it
    expect(localStorage.getItem('aquafort_token')).toBe('new-access')
    expect(localStorage.getItem('aquafort_refresh')).toBe('new-refresh')
  })
})
