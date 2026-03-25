import { beforeEach, describe, expect, it, vi } from 'vitest'

const readAuthCookieMock = vi.fn(async () => undefined)
const setAuthCookieMock = vi.fn()
const fetchMock = vi.fn(async () => ({ ok: true, source: 'backend' }))

vi.mock('~~/server/utils/authCookie', () => ({
  readAuthCookie: readAuthCookieMock,
  setAuthCookie: setAuthCookieMock,
}))

vi.mock('~~/server/utils/redis', () => ({
  getRedisClient: vi.fn(async () => ({
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    hIncrBy: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
  })),
}))

vi.mock('~~/server/utils/cacheKeyBuilder', () => ({
  buildCacheKey: vi.fn(() => 'cache:key'),
  buildCacheScanPattern: vi.fn(() => 'cache:*'),
  buildCacheScopePrefix: vi.fn(() => 'cache:scope'),
  buildQueryHash: vi.fn(() => 'query-hash'),
  toPathResourceIdentifier: vi.fn((path: string) => path.replaceAll('/', ':')),
}))

vi.mock('~~/server/utils/privateCacheKey', () => ({
  buildFunctionalQuerySegment: vi.fn(() => ''),
  getPrivateResourceIdentifier: vi.fn(() => 'private-resource'),
  isPrivateCacheRoute: vi.fn(() => false),
}))

describe('backend proxy - public quiz leaderboard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    ;(globalThis as any).defineEventHandler = (handler: any) => handler
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: { apiBase: 'http://api.example.test' },
    })
    ;(globalThis as any).getRouterParam = () => 'api/v1/public/quiz/general/leaderboard'
    ;(globalThis as any).getHeader = () => undefined
    ;(globalThis as any).getMethod = () => 'GET'
    ;(globalThis as any).getQuery = () => ({})
    ;(globalThis as any).readBody = vi.fn()
    ;(globalThis as any).readRawBody = vi.fn()
    ;(globalThis as any).createError = (payload: unknown) => payload
    ;(globalThis as any).$fetch = fetchMock
  })

  it('n’exige pas de cookie/token local et ne force pas Authorization', async () => {
    const handlerModule = await import('~/server/api/backend/[...path].ts')
    const handler = handlerModule.default

    const response = await handler({})

    expect(response).toEqual({ ok: true, source: 'backend' })
    expect(readAuthCookieMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.Authorization).toBeUndefined()
  })
})
