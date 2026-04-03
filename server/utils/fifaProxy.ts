import type { H3Event } from 'h3'
import { buildCacheKey } from '~~/server/utils/cacheKeyBuilder'
import { getRedisClient } from '~~/server/utils/redis'

const DEFAULT_FIFA_TIMEOUT_MS = 6000
const DEFAULT_FIFA_RETRY_COUNT = 0
const FIFA_CACHE_TTL_SECONDS = 60

type FifaProxyErrorCode =
  | 'FIFA_PROXY_API_SPORTS_MISCONFIGURED'
  | 'FIFA_PROXY_API_SPORTS_TIMEOUT'
  | 'FIFA_PROXY_API_SPORTS_RATE_LIMITED'
  | 'FIFA_PROXY_API_SPORTS_UNAUTHORIZED'
  | 'FIFA_PROXY_API_SPORTS_FORBIDDEN'
  | 'FIFA_PROXY_API_SPORTS_UPSTREAM_ERROR'

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

const createFifaProxyError = (
  statusCode: number,
  code: FifaProxyErrorCode,
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

const readFifaConfig = () => {
  const config = useRuntimeConfig()
  const apiBase = config.fifa?.apiBase?.trim()
  const apiKey = config.fifa?.apiKey?.trim()
  const accessMode = (config.fifa?.accessMode || '').toLowerCase()
  const timeoutMs = Number(config.fifa?.timeoutMs)
  const retryCount = Number(config.fifa?.retryCount)
  const useRapidApi = accessMode === 'rapidapi'
    || apiBase?.includes('rapidapi.com')

  if (!apiBase || !apiKey) {
    throw createFifaProxyError(
      500,
      'FIFA_PROXY_API_SPORTS_MISCONFIGURED',
      'API-Football (API-Sports) proxy is not configured on the server.',
      { missingApiBase: !apiBase, missingApiKey: !apiKey },
    )
  }

  return {
    apiBase,
    apiKey,
    useRapidApi,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_FIFA_TIMEOUT_MS,
    retryCount: Number.isFinite(retryCount) && retryCount >= 0 ? Math.floor(retryCount) : DEFAULT_FIFA_RETRY_COUNT,
  }
}

const buildFifaCacheKey = (endpoint: string, query: Record<string, string | number | boolean | Array<string | number | boolean>>) => {
  const identifier = endpoint.replace(/^\//, '') || 'root'
  return buildCacheKey({
    scope: 'public',
    resource: 'fifa',
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
  } catch {
    return null
  }
}

const writeToRedisCache = async (cacheKey: string, payload: unknown) => {
  try {
    const redis = await getRedisClient()
    await redis.setEx(cacheKey, FIFA_CACHE_TTL_SECONDS, JSON.stringify(payload))
  } catch {
    // graceful fallback when redis is unavailable
  }
}

export const proxyFifaRequest = async <T>(event: H3Event, endpoint: string): Promise<T> => {
  const { apiBase, apiKey, useRapidApi, timeoutMs, retryCount } = readFifaConfig()
  const query = normalizeQuery(getQuery(event))
  const shouldBypassCache = getHeader(event, 'x-fifa-refresh') === '1'
  const cacheKey = buildFifaCacheKey(endpoint, query)
  const cached = await readFromRedisCache<T>(cacheKey)

  if (!shouldBypassCache) {
    if (cached !== null) {
      return cached
    }
  }

  try {
    const payload = await $fetch<T>(endpoint, {
      baseURL: apiBase,
      query,
      retry: retryCount,
      timeout: timeoutMs,
      headers: {
        'x-apisports-key': apiKey,
        ...(useRapidApi ? { 'x-rapidapi-host': 'v3.football.api-sports.io' } : {}),
      },
    })

    await writeToRedisCache(cacheKey, payload)
    return payload
  }
  catch (error) {
    if (isTimeoutError(error)) {
      throw createFifaProxyError(504, 'FIFA_PROXY_API_SPORTS_TIMEOUT', 'API-Football (API-Sports) timeout reached.')
    }

    const statusCode = toStatusCode(error)

    if (cached !== null) {
      return cached
    }

    if (statusCode === 429) {
      throw createFifaProxyError(503, 'FIFA_PROXY_API_SPORTS_RATE_LIMITED', 'API-Football (API-Sports) rate limit reached.')
    }

    if (statusCode === 401) {
      throw createFifaProxyError(502, 'FIFA_PROXY_API_SPORTS_UNAUTHORIZED', 'API-Football (API-Sports) rejected the API key.')
    }

    if (statusCode === 403) {
      throw createFifaProxyError(502, 'FIFA_PROXY_API_SPORTS_FORBIDDEN', 'API-Football (API-Sports) refused the request.')
    }

    throw createFifaProxyError(
      502,
      'FIFA_PROXY_API_SPORTS_UPSTREAM_ERROR',
      'API-Football (API-Sports) request failed.',
      statusCode ? { upstreamStatusCode: statusCode } : undefined,
    )
  }
}
