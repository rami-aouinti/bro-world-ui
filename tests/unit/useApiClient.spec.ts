import { beforeEach, describe, expect, it, vi } from 'vitest'

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const buildRawResponse = <T>(data: T) => ({
  status: 200,
  _data: data,
  headers: new Headers(),
})

const setupApiClientDependencies = () => {
  const rawFetch = vi.fn()
  const track = vi.fn()
  const initSession = vi.fn()
  const authState = { value: 'authenticated' }
  const authSessionStore = { token: 'token-abc' }

  vi.stubGlobal('$fetch', { raw: rawFetch })
  vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
    public: {
      debugTelemetry: false,
    },
  })))
  vi.stubGlobal('useAuthSessionStore', vi.fn(() => authSessionStore))
  vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: '' })))
  vi.stubGlobal('useTracker', vi.fn(() => ({
    track,
    trackError: vi.fn(),
    trackLatency: vi.fn(),
  })))
  vi.stubGlobal('useAuth', vi.fn(() => ({
    initialized: { value: true },
    authState,
    isAuthenticated: { value: true },
    sessionCorrelationId: { value: 'corr-1' },
    lastAuthFailureAt: { value: 0 },
    initSession,
    awaitAuthReady: vi.fn(),
  })))

  return { rawFetch, track, initSession, authState, authSessionStore }
}

describe('useApiClient dedupe behavior', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('ne dedupe pas deux POST simultanés avec des body différents', async () => {
    const { rawFetch } = setupApiClientDependencies()
    const firstDeferred = createDeferred<ReturnType<typeof buildRawResponse>>()
    const secondDeferred = createDeferred<ReturnType<typeof buildRawResponse>>()

    rawFetch
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockImplementationOnce(() => secondDeferred.promise)

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    const firstPost = apiFetch('/api/v1/private/items', {
      method: 'POST',
      body: { name: 'first' },
    })
    const secondPost = apiFetch('/api/v1/private/items', {
      method: 'POST',
      body: { name: 'second' },
    })

    await Promise.resolve()

    expect(rawFetch).toHaveBeenCalledTimes(2)

    firstDeferred.resolve(buildRawResponse({ id: 1 }))
    secondDeferred.resolve(buildRawResponse({ id: 2 }))

    await expect(firstPost).resolves.toEqual({ id: 1 })
    await expect(secondPost).resolves.toEqual({ id: 2 })
  })

  it('dedupe deux GET identiques simultanés', async () => {
    const { rawFetch, track } = setupApiClientDependencies()
    const deferred = createDeferred<ReturnType<typeof buildRawResponse>>()

    rawFetch.mockImplementation(() => deferred.promise)

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    const firstGet = apiFetch('/api/v1/public/resource', { method: 'GET' })
    const secondGet = apiFetch('/api/v1/public/resource', { method: 'GET' })

    expect(rawFetch).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('api.request.deduplicated', expect.objectContaining({
      method: 'GET',
      path: 'api/v1/public/resource',
    }))

    deferred.resolve(buildRawResponse({ ok: true }))

    await expect(firstGet).resolves.toEqual({ ok: true })
    await expect(secondGet).resolves.toEqual({ ok: true })
  })

  it('autorise le dedupe pour une mutation quand idempotencyKey est fourni', async () => {
    const { rawFetch, track } = setupApiClientDependencies()
    const deferred = createDeferred<ReturnType<typeof buildRawResponse>>()

    rawFetch.mockImplementation(() => deferred.promise)

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    const firstMutation = apiFetch('/api/v1/private/items', {
      method: 'POST',
      idempotencyKey: 'idempotent-op-1',
      body: { name: 'shared' },
    })
    const secondMutation = apiFetch('/api/v1/private/items', {
      method: 'POST',
      idempotencyKey: 'idempotent-op-1',
      body: { name: 'shared' },
    })

    await Promise.resolve()

    expect(rawFetch).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('api.request.deduplicated', expect.objectContaining({
      method: 'POST',
      path: 'api/v1/private/items',
    }))

    deferred.resolve(buildRawResponse({ accepted: true }))

    await expect(firstMutation).resolves.toEqual({ accepted: true })
    await expect(secondMutation).resolves.toEqual({ accepted: true })
  })

  it('n’ajoute pas de header Authorization quand skipAuthHeader est activé', async () => {
    const { rawFetch } = setupApiClientDependencies()
    rawFetch.mockResolvedValue(buildRawResponse({ ok: true }))

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await apiFetch('/api/v1/public/quiz/general/categories', {
      method: 'GET',
      skipAuthHeader: true,
    })

    expect(rawFetch).toHaveBeenCalledWith(
      '/api/backend/api/v1/public/quiz/general/categories',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    )
  })

  it('revalide la session puis relance une route privée après un 401 backend', async () => {
    const { rawFetch, initSession, authSessionStore } = setupApiClientDependencies()
    rawFetch
      .mockRejectedValueOnce({ status: 401 })
      .mockResolvedValueOnce(buildRawResponse({ ok: true }))
    initSession.mockImplementation(async () => {
      authSessionStore.token = 'token-refreshed'
    })

    const { useApiClient } = await import('~/app/composables/useApiClient')
    const { apiFetch } = useApiClient()

    await expect(apiFetch('/api/v1/private/items', {
      method: 'GET',
    })).resolves.toEqual({ ok: true })

    expect(initSession).toHaveBeenCalledWith(true)
    expect(rawFetch).toHaveBeenNthCalledWith(2, '/api/backend/api/v1/private/items', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer token-refreshed',
      }),
    }))
  })
})
