import { readAuthCookie, requireAuthCookie, setAuthCookie } from '~~/server/utils/authCookie'
import { getRedisClient } from '~~/server/utils/redis'
import { buildCacheKey, buildCacheScanPattern, buildCacheScopePrefix, buildQueryHash, toPathResourceIdentifier } from '~~/server/utils/cacheKeyBuilder'
import { createHash } from 'node:crypto'
import { buildFunctionalQuerySegment, getPrivateResourceIdentifier, isPrivateCacheRoute } from '~~/server/utils/privateCacheKey'

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
  '/api/v1/public/users',
  '/api/v1/page/public/home/en',
  '/api/v1/page/public/home/fr',
  '/api/v1/page/public/about/en',
  '/api/v1/page/public/about/fr',
  '/api/v1/page/public/contact/en',
  '/api/v1/page/public/contact/fr',
  '/api/v1/page/public/faq/en',
  '/api/v1/page/public/faq/fr',
])

const PUBLIC_BACKEND_PATH_PREFIXES = [
  '/api/v1/recruit/public/',
  '/api/v1/page/public/',
  '/api/v1/public/blogs/',
  '/api/v1/blog/',
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
  '/api/v1/public/users',
  '/api/v1/recruit/public',
  '/api/v1/recruit/private',
  '/api/v1/private/blogs',
  '/api/v1/private/stories',
  '/api/v1/blog/',
  '/api/v1/profile',
  '/api/v1/events',
  '/api/v1/notifications',
  '/api/v1/chat/private/conversations',
  '/api/v1/users/me',
  '/api/v1/page/home',
  '/api/v1/page/about',
  '/api/v1/page/contact',
  '/api/v1/page/faq',
  '/api/v1/page/public',
  '/api/v1/crm/applications',
]

const NOTIFICATION_EVENTS_ROUTE_PREFIX = '/api/v1/notifications'
const NOTIFICATION_EVENTS_MAX_ITEMS = 200
const CACHE_METRICS_KEY = buildCacheKey({
  scope: 'system',
  resource: 'cache',
  identifier: 'metrics',
})

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT'])

const ENTITY_CACHE_INVALIDATION_RULES: Array<{ routePrefix: string, cachePrefixes: string[] }> = [
  {
    routePrefix: '/api/v1/profile/applications',
    cachePrefixes: ['/api/v1/application/public', '/api/v1/application/private'],
  },
  {
    routePrefix: '/api/v1/recruit/',
    cachePrefixes: ['/api/v1/recruit/public', '/api/v1/recruit/private'],
  },
  {
    routePrefix: '/api/v1/private/blogs/',
    cachePrefixes: ['/api/v1/private/blogs'],
  },
  {
    routePrefix: '/api/v1/private/blog/',
    cachePrefixes: ['/api/v1/private/blogs'],
  },
  {
    routePrefix: '/api/v1/private/stories',
    cachePrefixes: ['/api/v1/private/stories'],
  },
  {
    routePrefix: '/api/v1/users/me',
    cachePrefixes: ['/api/v1/users/me'],
  },
  {
    routePrefix: '/api/v1/chat/private/',
    cachePrefixes: ['/api/v1/chat/private/conversations'],
  },
  {
    routePrefix: '/api/v1/users/',
    cachePrefixes: ['/api/v1/users/me'],
  },
  {
    routePrefix: '/api/v1/page/',
    cachePrefixes: ['/api/v1/page/home', '/api/v1/page/about', '/api/v1/page/contact', '/api/v1/page/faq', '/api/v1/page/public'],
  },
  {
    routePrefix: '/api/v1/crm/applications/',
    cachePrefixes: ['/api/v1/crm/applications'],
  },
]

const ONE_HOUR_IN_SECONDS = 60 * 60
const SIX_HOURS_IN_SECONDS = ONE_HOUR_IN_SECONDS * 6
const FIFTEEN_MINUTES_IN_SECONDS = 60 * 15
const TEN_MINUTES_IN_SECONDS = 60 * 10
const THREE_MINUTES_IN_SECONDS = 60 * 3
const TWO_MINUTES_IN_SECONDS = 60 * 2
const THIRTY_SECONDS_IN_SECONDS = 30
const ONE_DAY_IN_SECONDS = 60 * 60 * 24
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365
const LONG_LIVED_PUBLIC_PAGE_SLUGS = new Set(['home', 'about', 'contact', 'faq'])

type CacheResource = 'profile' | 'conversation' | 'notifications' | 'events' | 'blog'
type CacheMetricType = 'hit' | 'miss' | 'invalidate'

interface CacheResourcePolicy {
  name: CacheResource
  ttlSeconds: number
  isMatch: (path: string) => boolean
  invalidationRules: Array<{
    event: string
    when: (path: string, method: string) => boolean
    cachePrefixes: string[]
    publicTags?: string[]
  }>
}

const CACHE_RESOURCE_POLICIES: CacheResourcePolicy[] = [
  {
    name: 'profile',
    ttlSeconds: THREE_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/profile') || path.startsWith('/api/v1/users/me'),
    invalidationRules: [
      {
        event: 'profile.update',
        when: (path, method) => ['PATCH', 'PUT'].includes(method) && (path.startsWith('/api/v1/profile') || path.startsWith('/api/v1/users/me')),
        cachePrefixes: ['/api/v1/profile', '/api/v1/users/me'],
      },
    ],
  },
  {
    name: 'conversation',
    ttlSeconds: TWO_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/chat/private/conversations'),
    invalidationRules: [
      {
        event: 'conversation.new_message',
        when: (path, method) => method === 'POST' && path.startsWith('/api/v1/chat/private/conversations'),
        cachePrefixes: ['/api/v1/chat/private/conversations'],
      },
    ],
  },
  {
    name: 'notifications',
    ttlSeconds: THIRTY_SECONDS_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/notifications'),
    invalidationRules: [
      {
        event: 'notifications.read_or_create',
        when: (path, method) => ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && path.startsWith('/api/v1/notifications'),
        cachePrefixes: ['/api/v1/notifications'],
      },
    ],
  },
  {
    name: 'events',
    ttlSeconds: FIFTEEN_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/events'),
    invalidationRules: [
      {
        event: 'events.crud',
        when: (path, method) => MUTATION_METHODS.has(method) && path.startsWith('/api/v1/events'),
        cachePrefixes: ['/api/v1/events'],
      },
    ],
  },
  {
    name: 'blog',
    ttlSeconds: TEN_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/private/blogs') || path.startsWith('/api/v1/public/blogs') || path.startsWith('/api/v1/blogs') || path.startsWith('/api/v1/blog/') || path.startsWith('/api/v1/private/stories'),
    invalidationRules: [
      {
        event: 'blog.publish_or_update_or_delete',
        when: (path, method) => MUTATION_METHODS.has(method) && (path.startsWith('/api/v1/private/blogs') || path.startsWith('/api/v1/private/blog/') || path.startsWith('/api/v1/blogs') || path.startsWith('/api/v1/private/stories')),
        cachePrefixes: ['/api/v1/private/blogs', '/api/v1/blogs', '/api/v1/private/stories'],
        publicTags: ['blog:*'],
      },
    ],
  },
]

interface PublicRouteCacheSpec {
  cacheKey: string
  ttl: number
}

const getQueryLocale = (query: Record<string, any>) => {
  const localeValue = query.locale || query.lang || query.language || 'en'
  return String(localeValue).toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

const getPublicRouteCacheSpec = (path: string, query: Record<string, any>): PublicRouteCacheSpec | null => {
  if (path.startsWith('/api/v1/page/public/')) {
    const segments = path.split('/').filter(Boolean)
    const slug = segments[4]
    const locale = segments[5]

    if (!slug || !locale) {
      return null
    }

    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'pages',
        identifier: `${slug}:${locale}`,
      }),
      ttl: LONG_LIVED_PUBLIC_PAGE_SLUGS.has(slug)
        ? ONE_YEAR_IN_SECONDS
        : SIX_HOURS_IN_SECONDS,
    }
  }

  if (path === '/api/v1/public/blogs/general' || path === '/api/v1/blogs/general/public') {
    const locale = getQueryLocale(query)
    const page = Number(query.page || 1)
    const { locale: _locale, lang: _lang, language: _language, page: _page, ...filters } = query
    const filtersHash = buildQueryHash(filters)

    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'blog',
        identifier: `list:${locale}:${page}:${filtersHash}`,
      }),
      ttl: TEN_MINUTES_IN_SECONDS,
    }
  }

  if (path.startsWith('/api/v1/private/blogs/application/') || path.startsWith('/api/v1/blogs/application/') || (path.startsWith('/api/v1/blog/') && path.endsWith('/feed'))) {
    const segments = path.split('/').filter(Boolean)
    const applicationIndex = segments.findIndex(segment => segment === 'application')
    const blogIndex = segments.findIndex(segment => segment === 'blog')
    const slug = applicationIndex >= 0
      ? segments[applicationIndex + 1]
      : (blogIndex >= 0 ? segments[blogIndex + 1] : undefined)

    if (!slug) {
      return null
    }

    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'blog',
        identifier: `${slug}:${getQueryLocale(query)}`,
      }),
      ttl: ONE_HOUR_IN_SECONDS,
    }
  }

  if (path === '/api/v1/application/public') {
    const platform = String(query.platformKey || query.platform || 'all')

    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'applicationPlatform',
        identifier: `${platform}:${getQueryLocale(query)}`,
      }),
      ttl: FIFTEEN_MINUTES_IN_SECONDS,
    }
  }

  if (path === '/api/v1/public/quiz/general/categories') {
    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'quiz',
        identifier: 'general:categories',
      }),
      ttl: ONE_DAY_IN_SECONDS,
    }
  }

  if (path === '/api/v1/public/quiz/general/levels') {
    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'quiz',
        identifier: 'general:levels',
      }),
      ttl: ONE_DAY_IN_SECONDS,
    }
  }

  if (path === '/api/v1/public/quiz/general/leaderboard') {
    return {
      cacheKey: buildCacheKey({
        scope: 'public',
        resource: 'quiz',
        identifier: `general:leaderboard:${buildQueryHash(query)}`,
      }),
      ttl: TWO_MINUTES_IN_SECONDS,
    }
  }

  return null
}

const getLocalizationCacheKey = (path: string, query: Record<string, any>) => {
  const { resource, identifier } = toPathResourceIdentifier(path)

  return buildCacheKey({
    scope: 'public',
    resource,
    identifier,
    query,
  })
}

const getEntityCacheKey = (path: string, query: Record<string, any>) => {
  const { resource, identifier } = toPathResourceIdentifier(path)

  return buildCacheKey({
    scope: 'public',
    resource,
    identifier,
    query,
  })
}

const getPrivateCacheKey = (path: string, query: Record<string, any>, userId: string) => {
  const functionalSegment = buildFunctionalQuerySegment(query)
  const privateResource = getPrivateResourceIdentifier(path)

  return buildCacheKey({
    scope: 'private',
    resource: userId,
    identifier: `${privateResource}:${functionalSegment}`,
    query,
  })
}

const getCacheResourcePolicy = (path: string) => CACHE_RESOURCE_POLICIES.find(policy => policy.isMatch(path))

const getEntityCacheTtl = (path: string) => getCacheResourcePolicy(path)?.ttlSeconds || ONE_DAY_IN_SECONDS

const recordCacheMetric = async (resource: CacheResource | 'generic', metric: CacheMetricType, detail: string) => {
  const metricKey = `${resource}.${metric}`

  try {
    const redis = await getRedisClient()
    await redis.hIncrBy(CACHE_METRICS_KEY, metricKey, 1)
  } catch (error) {
    console.warn('Cache metric write failed', error)
  }

  console.info('[cache.metric]', {
    resource,
    metric,
    detail,
  })
}

const normalizeBearerToken = (rawToken: string | null | undefined) => {
  if (!rawToken) {
    return undefined
  }

  const trimmed = rawToken.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.replace(/^Bearer\s+/i, '')
}

const getUsersMeCacheKey = (path: string, query: Record<string, any>, bearerToken: string) => {
  const tokenHash = createHash('sha256').update(bearerToken).digest('hex').slice(0, 16)
  const { resource, identifier } = toPathResourceIdentifier(path)

  return buildCacheKey({
    scope: 'private',
    resource,
    identifier: `${identifier}.token-${tokenHash}`,
    query,
  })
}

const readCache = async (
  cacheKey: string,
  label: string,
  options: { requiresUserContext?: boolean, userId?: string, resource?: CacheResource | 'generic' } = {},
) => {
  if (options.requiresUserContext && !options.userId) {
    return null
  }

  const metricResource = options.resource || 'generic'

  try {
    const redis = await getRedisClient()
    const cachedValue = await redis.get(cacheKey)

    if (!cachedValue) {
      await recordCacheMetric(metricResource, 'miss', cacheKey)
      return null
    }

    await recordCacheMetric(metricResource, 'hit', cacheKey)
    return JSON.parse(cachedValue)
  } catch (error) {
    console.warn(`${label} cache read failed`, error)
    await recordCacheMetric(metricResource, 'miss', `${cacheKey}:read-failed`)
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
    const { resource, identifier } = toPathResourceIdentifier(prefix)
    const pattern = buildCacheScanPattern({
      scope: prefix.includes('/private') ? 'private' : 'public',
      resource,
      identifierPattern: `${identifier}*`,
    })
    const keysToDelete: string[] = []

    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(String(key))
    }

    if (keysToDelete.length) {
      await redis.del(keysToDelete)
    }

    return keysToDelete.length
  } catch (error) {
    console.warn('Entity cache invalidation failed', error)
    return 0
  }
}

const clearPublicCacheByTag = async (tagPattern: string) => {
  try {
    const redis = await getRedisClient()
    const pattern = `${buildCacheScopePrefix('public')}:${tagPattern}`
    const keysToDelete: string[] = []

    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(String(key))
    }

    if (keysToDelete.length) {
      await redis.del(keysToDelete)
    }

    return keysToDelete.length
  } catch (error) {
    console.warn('Public cache invalidation failed', error)
    return 0
  }
}

const invalidateUserProfile = async () => {
  const deletedByProfile = await clearCacheByPrefix('/api/v1/profile')
  const deletedByUsersMe = await clearCacheByPrefix('/api/v1/users/me')
  await recordCacheMetric('profile', 'invalidate', `profile:${deletedByProfile + deletedByUsersMe}`)
}

const invalidateConversation = async () => {
  const deleted = await clearCacheByPrefix('/api/v1/chat/private/conversations')
  await recordCacheMetric('conversation', 'invalidate', `conversation:${deleted}`)
}

const invalidateNotifications = async () => {
  const deleted = await clearCacheByPrefix('/api/v1/notifications')
  await recordCacheMetric('notifications', 'invalidate', `notifications:${deleted}`)
}

const invalidateEvents = async () => {
  const deleted = await clearCacheByPrefix('/api/v1/events')
  await recordCacheMetric('events', 'invalidate', `events:${deleted}`)
}

const invalidateBlog = async () => {
  const deletedPrivate = await clearCacheByPrefix('/api/v1/private/blogs')
  const deletedPublic = await clearPublicCacheByTag('blog:*')
  await recordCacheMetric('blog', 'invalidate', `blog:${deletedPrivate + deletedPublic}`)
}

const storeNotificationEvent = async (input: {
  path: string
  method: string
  query: Record<string, any>
  hasBody: boolean
}) => {
  try {
    const redis = await getRedisClient()
    const notificationsRedisKey = buildCacheKey({
      scope: 'system',
      resource: 'notifications',
      identifier: 'events',
    })
    const payload = {
      ...input,
      createdAt: new Date().toISOString(),
    }

    await redis.lPush(notificationsRedisKey, JSON.stringify(payload))
    await redis.lTrim(notificationsRedisKey, 0, NOTIFICATION_EVENTS_MAX_ITEMS - 1)
  } catch (error) {
    console.warn('Notification event store failed', error)
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

const getPublicInvalidationTags = (targetPath: string) => {
  if (targetPath.startsWith('/api/v1/private/blogs/') || targetPath.startsWith('/api/v1/private/blog/') || targetPath.startsWith('/api/v1/blogs/') || targetPath.startsWith('/api/v1/blog/')) {
    return ['blog:*']
  }

  if (targetPath.startsWith('/api/v1/page/')) {
    return ['pages:*']
  }

  if (targetPath.startsWith('/api/v1/profile/applications') || targetPath.startsWith('/api/v1/application/')) {
    return ['applicationPlatform:*']
  }

  return []
}

const getResourceInvalidationActions = (targetPath: string, method: string) => {
  const actions: Array<() => Promise<void>> = []

  const addAction = (resource: CacheResource) => {
    if (resource === 'profile') {
      actions.push(invalidateUserProfile)
      return
    }

    if (resource === 'conversation') {
      actions.push(invalidateConversation)
      return
    }

    if (resource === 'notifications') {
      actions.push(invalidateNotifications)
      return
    }

    if (resource === 'events') {
      actions.push(invalidateEvents)
      return
    }

    actions.push(invalidateBlog)
  }

  for (const policy of CACHE_RESOURCE_POLICIES) {
    const shouldInvalidate = policy.invalidationRules.some(rule => rule.when(targetPath, method))
    if (shouldInvalidate) {
      addAction(policy.name)
    }
  }

  return actions
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

  const tokenFromAuthorizationHeader = normalizeBearerToken(getHeader(event, 'authorization'))
  let bearerToken: string | undefined = tokenFromAuthorizationHeader
  let authCookiePayload: Awaited<ReturnType<typeof requireAuthCookie>> | undefined

  if (!isPublicRoute && !bearerToken) {
    authCookiePayload = await requireAuthCookie(event)
    bearerToken = authCookiePayload.token
  }

  if (!authCookiePayload && !isPublicRoute) {
    authCookiePayload = await readAuthCookie(event) || undefined
  }

  const authenticatedUserId = undefined

  const method = getMethod(event)
  const contentType = getHeader(event, 'content-type') || ''
  const isMultipartRequest = contentType.startsWith('multipart/form-data')
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : isMultipartRequest
      ? await readRawBody(event, false)
      : await readBody(event)
  const query = getQuery(event)

  const publicRouteCacheSpec = method === 'GET' ? getPublicRouteCacheSpec(targetPath, query) : null
  const shouldCacheLocalization = method === 'GET' && LOCALIZATION_CACHE_PATHS.has(targetPath)
  const shouldCacheEntity = !publicRouteCacheSpec && method === 'GET' && ENTITY_CACHE_PREFIXES.some(prefix => targetPath.startsWith(prefix))

  if (publicRouteCacheSpec) {
    const cachedPayload = await readCache(publicRouteCacheSpec.cacheKey, 'Public route')

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  if (shouldCacheLocalization) {
    const cacheKey = getLocalizationCacheKey(targetPath, query)
    const cachedPayload = await readCache(cacheKey, 'Localization')

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  if (shouldCacheEntity) {
    const isPrivateRoute = isPrivateCacheRoute(targetPath)
    const resourcePolicy = getCacheResourcePolicy(targetPath)
    const cacheKey = isPrivateRoute
      ? (authenticatedUserId ? getPrivateCacheKey(targetPath, query, authenticatedUserId) : undefined)
      : (targetPath.startsWith('/api/v1/users/me') && bearerToken
          ? getUsersMeCacheKey(targetPath, query, bearerToken)
          : getEntityCacheKey(targetPath, query))

    const cachedPayload = cacheKey
      ? await readCache(cacheKey, 'Entity', {
          requiresUserContext: isPrivateRoute,
          userId: authenticatedUserId,
          resource: resourcePolicy?.name,
        })
      : null

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

    if (publicRouteCacheSpec) {
      await writeCache(publicRouteCacheSpec.cacheKey, response, publicRouteCacheSpec.ttl, 'Public route')
    }

    if (shouldCacheLocalization) {
      const cacheKey = getLocalizationCacheKey(targetPath, query)
      await writeCache(cacheKey, response, ONE_YEAR_IN_SECONDS, 'Localization')
    }

    if (shouldCacheEntity) {
      const isPrivateRoute = isPrivateCacheRoute(targetPath)
      const resourcePolicy = getCacheResourcePolicy(targetPath)
      const cacheKey = isPrivateRoute
        ? (authenticatedUserId ? getPrivateCacheKey(targetPath, query, authenticatedUserId) : undefined)
        : (targetPath.startsWith('/api/v1/users/me') && bearerToken
            ? getUsersMeCacheKey(targetPath, query, bearerToken)
            : getEntityCacheKey(targetPath, query))

      if (cacheKey) {
        await writeCache(cacheKey, response, getEntityCacheTtl(targetPath), resourcePolicy ? `Entity:${resourcePolicy.name}` : 'Entity')
      }
    }

    const shouldStoreNotificationEvent = targetPath.startsWith(NOTIFICATION_EVENTS_ROUTE_PREFIX)
    if (shouldStoreNotificationEvent) {
      await storeNotificationEvent({
        path: targetPath,
        method,
        query,
        hasBody: body !== undefined,
      })
    }

    const shouldInvalidateEntityCache = MUTATION_METHODS.has(method)
    if (shouldInvalidateEntityCache) {
      const resourceInvalidationActions = getResourceInvalidationActions(targetPath, method)
      for (const action of resourceInvalidationActions) {
        await action()
      }

      const cachePrefixes = getInvalidationCachePrefixes(targetPath)
      for (const cachePrefix of cachePrefixes) {
        const deleted = await clearCacheByPrefix(cachePrefix)
        await recordCacheMetric('generic', 'invalidate', `${cachePrefix}:${deleted}`)
      }

      const publicTags = getPublicInvalidationTags(targetPath)
      for (const publicTag of publicTags) {
        const deleted = await clearPublicCacheByTag(publicTag)
        await recordCacheMetric('generic', 'invalidate', `${publicTag}:${deleted}`)
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
