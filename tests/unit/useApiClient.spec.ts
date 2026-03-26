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

  vi.stubGlobal('$fetch', { raw: rawFetch })
  vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: 'token-abc' })))
  vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ authorization: '' })))
  vi.stubGlobal('useTracker', vi.fn(() => ({
    track,
    trackError: vi.fn(),
    trackLatency: vi.fn(),
  })))
  vi.stubGlobal('useAuth', vi.fn(() => ({
    initialized: { value: true },
    authState: { value: 'authenticated' },
    isAuthenticated: { value: true },
    sessionCorrelationId: { value: 'corr-1' },
    lastAuthFailureAt: { value: 0 },
    initSession: vi.fn(),
    awaitAuthReady: vi.fn(),
  })))

  return { rawFetch, track }
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
})
