import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useApiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('injecte le header Authorization avec le token de session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: 'abc123' })))
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: 'Bearer server' })))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('api/v1/test')

    expect(fetchMock).toHaveBeenCalledWith('/api/backend/api/v1/test', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        Authorization: 'Bearer abc123',
      }),
    }))
  })

  it('fallback sur le header authorization de la requête serveur sans token utilisateur', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: '__server_session__' })))
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: 'Bearer server' })))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('/api/v1/test')

    expect(fetchMock).toHaveBeenCalledWith('/api/backend/api/v1/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer server',
      }),
    }))
  })
})
