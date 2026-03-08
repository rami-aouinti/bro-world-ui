import { requireAuthCookie, setAuthCookie } from '~~/server/utils/authCookie'
import { getRedisClient } from '~~/server/utils/redis'

const PUBLIC_BACKEND_PATHS = new Set([
  '/api/health',
  '/api/version',
  '/api/v1/localization/language',
  '/api/v1/localization/locale',
  '/api/v1/localization/timezone',
  '/api/v1/auth/get_token',
  '/api/v1/application/public',
  '/api/v1/platform/public',
  '/api/v1/plugin/public',
])

const PUBLIC_BACKEND_PATH_PREFIXES = [
  '/api/v1/recruit/public/',
]

const LOCALIZATION_CACHE_PATHS = new Set([
  '/api/v1/localization/language',
  '/api/v1/localization/locale',
  '/api/v1/localization/timezone',
])

const ENTITY_CACHE_PREFIXES = [
  '/api/v1/user',
  '/api/v1/user_group',
  '/api/v1/role',
  '/api/v1/api_key',
  '/api/v2/api_key',
  '/api/v1/configuration',
  '/api/v1/platform',
  '/api/v1/plugin',
  '/api/v1/application/private',
  '/api/v1/application/public',
  '/api/v1/platform/public',
  '/api/v1/plugin/public',
  '/api/v1/recruit/public',
  '/api/v1/recruit/private',
]

const ENTITY_CACHE_INVALIDATION_RULES: Array<{ routePrefix: string, cachePrefixes: string[] }> = [
  {
    routePrefix: '/api/v1/profile/applications',
    cachePrefixes: ['/api/v1/application/public', '/api/v1/application/private'],
  },
  {
    routePrefix: '/api/v1/recruit/',
    cachePrefixes: ['/api/v1/recruit/public', '/api/v1/recruit/private'],
  },
]

const ONE_DAY_IN_SECONDS = 60 * 60 * 24
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const toSortedQuerySuffix = (query: Record<string, any>) => {
  const queryEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))

  if (!queryEntries.length) {
    return ''
  }

  return queryEntries
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&')
}

const getLocalizationCacheKey = (path: string, query: Record<string, any>) => {
  const suffix = toSortedQuerySuffix(query)

  if (!suffix) {
    return `localization:${path}`
  }

  return `localization:${path}?${suffix}`
}

const getEntityCacheKey = (path: string, query: Record<string, any>) => {
  const suffix = toSortedQuerySuffix(query)

  if (!suffix) {
    return `entity:${path}`
  }

  return `entity:${path}?${suffix}`
}

const readCache = async (cacheKey: string, label: string) => {
  try {
    const redis = await getRedisClient()
    const cachedValue = await redis.get(cacheKey)

    if (!cachedValue) {
      return null
    }

    return JSON.parse(cachedValue)
  } catch (error) {
    console.warn(`${label} cache read failed`, error)
    return null
  }
}

const writeCache = async (cacheKey: string, payload: unknown, ttl: number, label: string) => {
  try {
    const redis = await getRedisClient()
    await redis.set(cacheKey, JSON.stringify(payload), {
      EX: ttl,
    })
  } catch (error) {
    console.warn(`${label} cache write failed`, error)
  }
}

const clearCacheByPrefix = async (prefix: string) => {
  try {
    const redis = await getRedisClient()
    const pattern = `entity:${prefix}*`
    const keysToDelete: string[] = []

    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(String(key))
    }

    if (keysToDelete.length) {
      await redis.del(keysToDelete)
    }
  } catch (error) {
    console.warn('Entity cache invalidation failed', error)
  }
}

const getInvalidationCachePrefixes = (targetPath: string) => {
  const rule = ENTITY_CACHE_INVALIDATION_RULES.find(({ routePrefix }) => targetPath.startsWith(routePrefix))

  if (rule) {
    return rule.cachePrefixes
  }

  const cachePrefix = ENTITY_CACHE_PREFIXES.find(prefix => targetPath.startsWith(prefix))

  return cachePrefix ? [cachePrefix] : []
}

const buildForwardHeaders = (event: any): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: getHeader(event, 'accept') || 'application/json',
  }

  const contentType = getHeader(event, 'content-type')
  if (contentType) {
    headers['content-type'] = contentType
  }

  const contentLength = getHeader(event, 'content-length')
  if (contentLength) {
    headers['content-length'] = contentLength
  }

  return headers
}

const handleBackendError = (error: any) => {
  const statusCode = error?.statusCode || error?.response?.status

  if (statusCode === 401 || statusCode === 403) {
    throw createError({
      statusCode,
      statusMessage: 'Backend authentication failed',
    })
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    throw createError({
      statusCode,
      statusMessage: 'Backend service unavailable',
    })
  }

  throw error
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const path = getRouterParam(event, 'path') || ''
  const targetPath = `/${path}`
  const isPublicRoute = PUBLIC_BACKEND_PATHS.has(targetPath)
    || PUBLIC_BACKEND_PATH_PREFIXES.some(prefix => targetPath.startsWith(prefix))

  let bearerToken: string | undefined
  let authCookiePayload: Awaited<ReturnType<typeof requireAuthCookie>> | undefined

  if (!isPublicRoute) {
    authCookiePayload = await requireAuthCookie(event)
    bearerToken = authCookiePayload.token
  }

  const method = getMethod(event)
  const contentType = getHeader(event, 'content-type') || ''
  const isMultipartRequest = contentType.startsWith('multipart/form-data')
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : isMultipartRequest
      ? await readRawBody(event, false)
      : await readBody(event)
  const query = getQuery(event)

  const shouldCacheLocalization = method === 'GET' && LOCALIZATION_CACHE_PATHS.has(targetPath)
  const shouldCacheEntity = method === 'GET' && ENTITY_CACHE_PREFIXES.some(prefix => targetPath.startsWith(prefix))

  if (shouldCacheLocalization) {
    const cacheKey = getLocalizationCacheKey(targetPath, query)
    const cachedPayload = await readCache(cacheKey, 'Localization')

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  if (shouldCacheEntity) {
    const cacheKey = getEntityCacheKey(targetPath, query)
    const cachedPayload = await readCache(cacheKey, 'Entity')

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  try {
    const headers = buildForwardHeaders(event)

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    const response = await $fetch(targetPath, {
      method,
      baseURL: config.public.apiBase,
      query,
      body,
      headers,
    })

    if (shouldCacheLocalization) {
      const cacheKey = getLocalizationCacheKey(targetPath, query)
      await writeCache(cacheKey, response, ONE_YEAR_IN_SECONDS, 'Localization')
    }

    if (shouldCacheEntity) {
      const cacheKey = getEntityCacheKey(targetPath, query)
      await writeCache(cacheKey, response, ONE_DAY_IN_SECONDS, 'Entity')
    }

    const shouldInvalidateEntityCache = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)
    if (shouldInvalidateEntityCache) {
      const cachePrefixes = getInvalidationCachePrefixes(targetPath)
      for (const cachePrefix of cachePrefixes) {
        await clearCacheByPrefix(cachePrefix)
      }
    }

    if (authCookiePayload) {
      await setAuthCookie(event, authCookiePayload)
    }

    return response
  } catch (error) {
    handleBackendError(error)
  }
})
