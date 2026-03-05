import { requireAuthCookie, setAuthCookie } from '~~/server/utils/authCookie'
import { getRedisClient } from '~~/server/utils/redis'

const PUBLIC_BACKEND_PATHS = new Set([
  '/api/health',
  '/api/version',
  '/api/v1/localization/language',
  '/api/v1/localization/locale',
  '/api/v1/localization/timezone',
  '/api/v1/auth/get_token',
])

const LOCALIZATION_CACHE_PATHS = new Set([
  '/api/v1/localization/language',
  '/api/v1/localization/locale',
  '/api/v1/localization/timezone',
])

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const getLocalizationCacheKey = (path: string, query: Record<string, any>) => {
  const queryEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))

  if (!queryEntries.length) {
    return `localization:${path}`
  }

  const querySuffix = queryEntries
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&')

  return `localization:${path}?${querySuffix}`
}

const readLocalizationCache = async (cacheKey: string) => {
  try {
    const redis = await getRedisClient()
    const cachedValue = await redis.get(cacheKey)

    if (!cachedValue) {
      return null
    }

    return JSON.parse(cachedValue)
  } catch (error) {
    console.warn('Localization cache read failed', error)
    return null
  }
}

const writeLocalizationCache = async (cacheKey: string, payload: unknown) => {
  try {
    const redis = await getRedisClient()
    await redis.set(cacheKey, JSON.stringify(payload), {
      EX: ONE_YEAR_IN_SECONDS,
    })
  } catch (error) {
    console.warn('Localization cache write failed', error)
  }
}

const buildForwardHeaders = (event: any): Record<string, string> => ({
  accept: getHeader(event, 'accept') || 'application/json',
  'content-type': getHeader(event, 'content-type') || 'application/json',
})

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

  let bearerToken: string | undefined
  let authCookiePayload: Awaited<ReturnType<typeof requireAuthCookie>> | undefined

  if (!isPublicRoute) {
    authCookiePayload = await requireAuthCookie(event)
    bearerToken = authCookiePayload.token
  }

  const method = getMethod(event)
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(event)
  const query = getQuery(event)
  const shouldCacheLocalization = method === 'GET' && LOCALIZATION_CACHE_PATHS.has(targetPath)

  if (shouldCacheLocalization) {
    const cacheKey = getLocalizationCacheKey(targetPath, query)
    const cachedLocalizationPayload = await readLocalizationCache(cacheKey)

    if (cachedLocalizationPayload !== null) {
      return cachedLocalizationPayload
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
      await writeLocalizationCache(cacheKey, response)
    }

    if (authCookiePayload) {
      await setAuthCookie(event, authCookiePayload)
    }

    return response
  } catch (error) {
    handleBackendError(error)
  }
})
