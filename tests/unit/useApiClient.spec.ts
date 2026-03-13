import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useApiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('injecte le header Authorization avec le token de session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const trackLatency = vi.fn()
    const trackError = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: 'abc123' })))
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: 'Bearer server' })))
    vi.stubGlobal('useTracker', vi.fn(() => ({ trackLatency, trackError })))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('api/v1/test')

    expect(fetchMock).toHaveBeenCalledWith('/api/backend/api/v1/test', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        Authorization: 'Bearer abc123',
      }),
    }))
    expect(trackLatency).not.toHaveBeenCalled()
    expect(trackError).not.toHaveBeenCalled()
  })

  it('conserve un header Authorization déjà fourni', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const trackLatency = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: '__server_session__' })))
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: 'Bearer server' })))
    vi.stubGlobal('useTracker', vi.fn(() => ({ trackLatency, trackError: vi.fn() })))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('/api/v1/test', { headers: { Authorization: 'Bearer custom' } })

    expect(fetchMock).toHaveBeenCalledWith('/api/backend/api/v1/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer custom',
      }),
    }))
    expect(trackLatency).not.toHaveBeenCalled()
  })

  it('mesure la latence sur un endpoint critique', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const trackLatency = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: 'abc123' })))
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: '' })))
    vi.stubGlobal('useTracker', vi.fn(() => ({ trackLatency, trackError: vi.fn() })))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('/api/v1/crm/applications/demo/dashboard', { method: 'GET' })

    expect(trackLatency).toHaveBeenCalledTimes(1)
    expect(trackLatency).toHaveBeenCalledWith(
      'api/v1/crm/applications/demo/dashboard',
      expect.any(Number),
      expect.objectContaining({
        method: 'GET',
        status: 'success',
      }),
    )
  })
})
