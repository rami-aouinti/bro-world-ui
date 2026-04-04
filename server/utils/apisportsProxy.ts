import type { H3Event } from 'h3'
import { buildCacheKey } from '~~/server/utils/cacheKeyBuilder'
import { getRedisClient } from '~~/server/utils/redis'

export type ApiSportsErrorCode =
  | 'API_SPORTS_PROXY_MISCONFIGURED'
  | 'API_SPORTS_PROXY_TIMEOUT'
  | 'API_SPORTS_PROXY_UNAUTHORIZED'
  | 'API_SPORTS_PROXY_FORBIDDEN'
  | 'API_SPORTS_PROXY_RATE_LIMITED'
  | 'API_SPORTS_PROXY_UPSTREAM_ERROR'

export type ApiSportsSportConfig = {
  sport: string
  baseUrl: string
  apiKey: string
  host?: string
  cacheTtlSeconds?: number
  liveCacheTtlSeconds?: number
  timeoutMs?: number
  retryCount?: number
  cacheResource?: string
  referenceEndpoints?: string[]
}

const DEFAULT_TIMEOUT_MS = 6000
const DEFAULT_RETRY_COUNT = 0
const DEFAULT_REFERENCE_CACHE_TTL_SECONDS = 86_400
const DEFAULT_LIVE_CACHE_TTL_SECONDS = 60

type EndpointCacheProfile = 'reference' | 'live'

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

const normalizeQuery = (query: Record<string, unknown>): Record<string, string | number | boolean | Array<string | number | boolean>> => {
  return Object.entries(query).reduce<Record<string, string | number | boolean | Array<string | number | boolean>>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc
    }

    if (Array.isArray(value)) {
      const normalizedArray = value.filter(
        (item): item is string | number | boolean => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean',
      )

      if (normalizedArray.length) {
        acc[key] = normalizedArray
      }

      return acc
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value
    }

    return acc
  }, {})
}

const normalizeEndpointForCache = (endpoint: string) => {
  const withLeadingSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const sanitized = withLeadingSlash.split('?')[0]?.replace(/\/+$/, '') || '/'
  return sanitized === '' ? '/' : sanitized
}

const toStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const candidate = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
    cause?: { status?: number }
  }

  return candidate.statusCode ?? candidate.status ?? candidate.response?.status ?? candidate.cause?.status
}

const isTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { name?: string, message?: string, code?: string }
  const name = (candidate.name || '').toLowerCase()
  const message = (candidate.message || '').toLowerCase()
  const code = (candidate.code || '').toLowerCase()

  return name.includes('timeout')
    || name.includes('abort')
    || message.includes('timeout')
    || message.includes('timed out')
    || code === 'etimedout'
}

const createApiSportsProxyError = (
  statusCode: number,
  code: ApiSportsErrorCode,
  message: string,
  details?: Record<string, unknown>,
) => createError({
  statusCode,
  statusMessage: message,
  data: {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
    },
  },
})

const resolveEndpointCacheProfile = (endpoint: string, referenceEndpoints: string[]): EndpointCacheProfile => {
  const normalizedEndpoint = normalizeEndpointForCache(endpoint)
  return new Set(referenceEndpoints).has(normalizedEndpoint) ? 'reference' : 'live'
}

const buildApiSportsCacheKey = (
  sportConfig: ApiSportsSportConfig,
  endpoint: string,
  profile: EndpointCacheProfile,
  query: Record<string, string | number | boolean | Array<string | number | boolean>>,
) => {
  const identifier = `${profile}.${normalizeEndpointForCache(endpoint).replace(/^\//, '').replace(/\//g, '.') || 'root'}`
  return buildCacheKey({
    scope: 'public',
    resource: sportConfig.cacheResource || `apisports.${sportConfig.sport}`,
    identifier,
    query,
  })
}

const readFromRedisCache = async <T>(cacheKey: string): Promise<T | null> => {
  try {
    const redis = await getRedisClient()
    const cachedValue = await redis.get(cacheKey)

    if (!cachedValue) {
      return null
    }

    return JSON.parse(cachedValue) as T
  }
  catch {
    return null
  }
}

const writeToRedisCache = async (cacheKey: string, payload: unknown, ttlSeconds: number) => {
  try {
    const redis = await getRedisClient()
    await redis.setEx(cacheKey, ttlSeconds, JSON.stringify(payload))
  }
  catch {
    // graceful fallback when redis is unavailable
  }
}

const readApiSportsBypassHeader = (event: H3Event, sport: string): boolean => {
  const normalizedSport = sport.toLowerCase()
  return getHeader(event, 'x-apisports-refresh') === '1'
    || getHeader(event, `x-${normalizedSport}-refresh`) === '1'
}

export const proxyApiSportsRequest = async <T>(
  event: H3Event,
  sportConfig: ApiSportsSportConfig,
  endpoint: string,
): Promise<T> => {
  const baseUrl = sportConfig.baseUrl.trim()
  const apiKey = sportConfig.apiKey.trim()

  if (!baseUrl || !apiKey) {
    throw createApiSportsProxyError(
      500,
      'API_SPORTS_PROXY_MISCONFIGURED',
      `API-Sports proxy is not configured for sport "${sportConfig.sport}".`,
      { sport: sportConfig.sport, missingApiBase: !baseUrl, missingApiKey: !apiKey },
    )
  }

  const query = normalizeQuery(getQuery(event))
  const referenceCacheTtlSeconds = parsePositiveInteger(sportConfig.cacheTtlSeconds) ?? DEFAULT_REFERENCE_CACHE_TTL_SECONDS
  const liveCacheTtlSeconds = parsePositiveInteger(sportConfig.liveCacheTtlSeconds) ?? DEFAULT_LIVE_CACHE_TTL_SECONDS
  const timeoutMs = parsePositiveInteger(sportConfig.timeoutMs) ?? DEFAULT_TIMEOUT_MS
  const retryCount = parsePositiveInteger(sportConfig.retryCount) ?? DEFAULT_RETRY_COUNT
  const referenceEndpoints = sportConfig.referenceEndpoints || []

  const shouldBypassCache = readApiSportsBypassHeader(event, sportConfig.sport)
  const cacheProfile = resolveEndpointCacheProfile(endpoint, referenceEndpoints)
  const cacheTtlSeconds = cacheProfile === 'reference' ? referenceCacheTtlSeconds : liveCacheTtlSeconds
  const cacheKey = buildApiSportsCacheKey(sportConfig, endpoint, cacheProfile, query)
  const cached = await readFromRedisCache<T>(cacheKey)

  if (!shouldBypassCache && cached !== null) {
    return cached
  }

  try {
    const payload = await $fetch<T>(endpoint, {
      baseURL: baseUrl,
      query,
      retry: retryCount,
      timeout: timeoutMs,
      headers: {
        'x-apisports-key': apiKey,
        ...(sportConfig.host ? { 'x-rapidapi-host': sportConfig.host } : {}),
      },
    })

    await writeToRedisCache(cacheKey, payload, cacheTtlSeconds)
    return payload
  }
  catch (error) {
    if (isTimeoutError(error)) {
      throw createApiSportsProxyError(504, 'API_SPORTS_PROXY_TIMEOUT', 'API-Sports timeout reached.', {
        sport: sportConfig.sport,
      })
    }

    const statusCode = toStatusCode(error)

    if (cached !== null) {
      return cached
    }

    if (statusCode === 401) {
      throw createApiSportsProxyError(502, 'API_SPORTS_PROXY_UNAUTHORIZED', 'API-Sports rejected the API key.', {
        sport: sportConfig.sport,
      })
    }

    if (statusCode === 403) {
      throw createApiSportsProxyError(502, 'API_SPORTS_PROXY_FORBIDDEN', 'API-Sports refused the request.', {
        sport: sportConfig.sport,
      })
    }

    if (statusCode === 429) {
      throw createApiSportsProxyError(503, 'API_SPORTS_PROXY_RATE_LIMITED', 'API-Sports rate limit reached.', {
        sport: sportConfig.sport,
      })
    }

    throw createApiSportsProxyError(
      502,
      'API_SPORTS_PROXY_UPSTREAM_ERROR',
      'API-Sports request failed.',
      { sport: sportConfig.sport, ...(statusCode ? { upstreamStatusCode: statusCode } : {}) },
    )
  }
}
