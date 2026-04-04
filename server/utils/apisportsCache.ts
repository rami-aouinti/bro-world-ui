import type { H3Event } from 'h3'
import { buildCacheKey } from '~~/server/utils/cacheKeyBuilder'
import { getRedisClient } from '~~/server/utils/redis'

export type ApiSportsCacheProfile = 'reference' | 'schedule' | 'live'

export type ApiSportsCacheTtlProfiles = Partial<Record<ApiSportsCacheProfile, number>>

type NormalizedQuery = Record<string, string | number | boolean | Array<string | number | boolean>>

const DEFAULT_API_SPORTS_CACHE_TTL_SECONDS: Record<ApiSportsCacheProfile, number> = {
  reference: 86_400,
  schedule: 600,
  live: 60,
}

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

export const normalizeApiSportsQuery = (query: Record<string, unknown>): NormalizedQuery => {
  return Object.entries(query).reduce<NormalizedQuery>((acc, [key, value]) => {
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

export const normalizeApiSportsEndpoint = (endpoint: string) => {
  const withLeadingSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const sanitized = withLeadingSlash.split('?')[0]?.replace(/\/+$/, '') || '/'
  return sanitized === '' ? '/' : sanitized
}

const isTruthyLiveQuery = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(isTruthyLiveQuery)
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'all'
}

const isScheduleOrGamesEndpoint = (normalizedEndpoint: string) => {
  return normalizedEndpoint.includes('/fixtures')
    || normalizedEndpoint.includes('/games')
    || normalizedEndpoint.includes('/schedules')
    || normalizedEndpoint.includes('/schedule')
}

const isLiveEndpoint = (normalizedEndpoint: string, query: NormalizedQuery) => {
  if (normalizedEndpoint.includes('/events')) {
    return true
  }

  if (normalizedEndpoint.includes('/odds') && isTruthyLiveQuery(query.live)) {
    return true
  }

  if ((normalizedEndpoint.includes('/fixtures') || normalizedEndpoint.includes('/games')) && isTruthyLiveQuery(query.live)) {
    return true
  }

  return false
}

export const resolveApiSportsCacheProfile = (
  endpoint: string,
  query: NormalizedQuery,
  referenceEndpoints: string[] = [],
): ApiSportsCacheProfile => {
  const normalizedEndpoint = normalizeApiSportsEndpoint(endpoint)
  const reference = new Set(referenceEndpoints.map(normalizeApiSportsEndpoint))

  if (reference.has(normalizedEndpoint)) {
    return 'reference'
  }

  if (isLiveEndpoint(normalizedEndpoint, query)) {
    return 'live'
  }

  if (isScheduleOrGamesEndpoint(normalizedEndpoint)) {
    return 'schedule'
  }

  return 'live'
}

export const resolveApiSportsCacheTtlSeconds = (
  profile: ApiSportsCacheProfile,
  configuredTtls: ApiSportsCacheTtlProfiles = {},
) => {
  return parsePositiveInteger(configuredTtls[profile]) ?? DEFAULT_API_SPORTS_CACHE_TTL_SECONDS[profile]
}

export const buildApiSportsCacheKey = (
  sport: string,
  endpoint: string,
  query: NormalizedQuery,
  resource = 'apisports',
) => {
  const normalizedSport = sport.trim().toLowerCase() || 'unknown'
  const normalizedEndpoint = normalizeApiSportsEndpoint(endpoint)
  const endpointIdentifier = normalizedEndpoint.replace(/^\//, '').replace(/\//g, '.') || 'root'

  return buildCacheKey({
    scope: 'public',
    resource,
    identifier: `${normalizedSport}.${endpointIdentifier}`,
    query,
  })
}

export const readFromApiSportsCache = async <T>(cacheKey: string): Promise<T | null> => {
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

export const writeToApiSportsCache = async (cacheKey: string, payload: unknown, ttlSeconds: number) => {
  try {
    const redis = await getRedisClient()
    await redis.setEx(cacheKey, ttlSeconds, JSON.stringify(payload))
  }
  catch {
    // graceful fallback when redis is unavailable
  }
}

export const shouldBypassApiSportsCache = (
  event: H3Event,
  sport: string,
  legacyHeaders: string[] = [],
) => {
  const normalizedSport = sport.trim().toLowerCase()

  const bypassHeaders = new Set([
    'x-sport-refresh',
    'x-apisports-refresh',
    `x-${normalizedSport}-refresh`,
    ...legacyHeaders.map(header => header.toLowerCase()),
  ])

  return [...bypassHeaders].some(header => getHeader(event, header) === '1')
}
