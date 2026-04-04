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

const DEFAULT_FIFA_TIMEOUT_MS = 6000
const DEFAULT_FIFA_RETRY_COUNT = 0
const DEFAULT_FOOTBALL_CACHE_TTL_SECONDS = 86_400
const DEFAULT_FOOTBALL_SCHEDULE_CACHE_TTL_SECONDS = 600
const DEFAULT_FOOTBALL_LIVE_CACHE_TTL_SECONDS = 60

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

const REFERENCE_ENDPOINTS = new Set([
  '/timezone',
  '/countries',
  '/leagues',
  '/leagues/seasons',
  '/teams',
  '/venues',
  '/odds/bookmakers',
  '/odds/bets',
])

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

const readFifaConfig = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.footballApi?.baseUrl?.trim()
  const apiKey = config.footballApi?.apiKey?.trim()
  const referenceCacheTtlSeconds = parsePositiveInteger(config.footballApi?.cacheTtlSeconds)
    ?? DEFAULT_FOOTBALL_CACHE_TTL_SECONDS
  const liveCacheTtlSeconds = parsePositiveInteger(process.env.FOOTBALL_LIVE_CACHE_TTL_SECONDS)
    ?? DEFAULT_FOOTBALL_LIVE_CACHE_TTL_SECONDS
  const scheduleCacheTtlSeconds = parsePositiveInteger(process.env.FOOTBALL_SCHEDULE_CACHE_TTL_SECONDS)
    ?? DEFAULT_FOOTBALL_SCHEDULE_CACHE_TTL_SECONDS
  const useRapidApi = baseUrl?.includes('rapidapi.com')

  if (!baseUrl || !apiKey) {
    throw createFifaProxyError(
      500,
      'FIFA_PROXY_API_SPORTS_MISCONFIGURED',
      'API-Football (API-Sports) proxy is not configured on the server.',
      { missingApiBase: !baseUrl, missingApiKey: !apiKey },
    )
  }

  return {
    apiBase: baseUrl,
    apiKey,
    useRapidApi,
    timeoutMs: DEFAULT_FIFA_TIMEOUT_MS,
    retryCount: DEFAULT_FIFA_RETRY_COUNT,
    referenceCacheTtlSeconds,
    scheduleCacheTtlSeconds,
    liveCacheTtlSeconds,
  }
}

export const proxyFifaRequest = async <T>(event: H3Event, endpoint: string): Promise<T> => {
  const {
    apiBase,
    apiKey,
    useRapidApi,
    timeoutMs,
    retryCount,
    referenceCacheTtlSeconds,
    scheduleCacheTtlSeconds,
    liveCacheTtlSeconds,
  } = readFifaConfig()
  const query = normalizeApiSportsQuery(getQuery(event))
  const shouldBypassCache = shouldBypassApiSportsCache(event, 'football', ['x-fifa-refresh'])
  const cacheProfile = resolveApiSportsCacheProfile(endpoint, query, [...REFERENCE_ENDPOINTS])
  const cacheTtlSeconds = resolveApiSportsCacheTtlSeconds(cacheProfile, {
    reference: referenceCacheTtlSeconds,
    schedule: scheduleCacheTtlSeconds,
    live: liveCacheTtlSeconds,
  })
  const cacheKey = buildApiSportsCacheKey('football', endpoint, query, 'fifa')
  const cached = await readFromApiSportsCache<T>(cacheKey)

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

    await writeToApiSportsCache(cacheKey, payload, cacheTtlSeconds)
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
