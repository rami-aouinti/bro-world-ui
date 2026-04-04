import type { H3Event } from 'h3'
import {
  buildApiSportsCacheKey,
  normalizeApiSportsQuery,
  readFromApiSportsCache,
  resolveApiSportsCacheProfile,
  resolveApiSportsCacheTtlSeconds,
  shouldBypassApiSportsCache,
  writeToApiSportsCache,
} from '~~/server/utils/apisportsCache'

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
  cacheTtlSeconds?: number // deprecated, mapped to reference profile for backward compatibility
  liveCacheTtlSeconds?: number // deprecated, mapped to live profile for backward compatibility
  scheduleCacheTtlSeconds?: number
  timeoutMs?: number
  retryCount?: number
  cacheResource?: string
  referenceEndpoints?: string[]
}

const DEFAULT_TIMEOUT_MS = 6000
const DEFAULT_RETRY_COUNT = 0
const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
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

  const query = normalizeApiSportsQuery(getQuery(event))
  const timeoutMs = parsePositiveInteger(sportConfig.timeoutMs) ?? DEFAULT_TIMEOUT_MS
  const retryCount = parsePositiveInteger(sportConfig.retryCount) ?? DEFAULT_RETRY_COUNT
  const referenceEndpoints = sportConfig.referenceEndpoints || []

  const shouldBypassCache = shouldBypassApiSportsCache(
    event,
    sportConfig.sport,
    sportConfig.sport.toLowerCase() === 'football' ? ['x-fifa-refresh'] : [],
  )
  const cacheProfile = resolveApiSportsCacheProfile(endpoint, query, referenceEndpoints)
  const cacheTtlSeconds = resolveApiSportsCacheTtlSeconds(cacheProfile, {
    reference: sportConfig.cacheTtlSeconds,
    schedule: sportConfig.scheduleCacheTtlSeconds,
    live: sportConfig.liveCacheTtlSeconds,
  })
  const cacheKey = buildApiSportsCacheKey(sportConfig.sport, endpoint, query, sportConfig.cacheResource || 'apisports')
  const cached = await readFromApiSportsCache<T>(cacheKey)

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

    await writeToApiSportsCache(cacheKey, payload, cacheTtlSeconds)
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
