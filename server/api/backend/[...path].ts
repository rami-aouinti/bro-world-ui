import { readAuthCookie, setAuthCookie } from '~~/server/utils/authCookie'
import { getRedisClient } from '~~/server/utils/redis'
import { buildCacheKey, buildCacheScanPattern, buildCacheScopePrefix, buildQueryHash, toPathResourceIdentifier } from '~~/server/utils/cacheKeyBuilder'
import { createHash, randomUUID } from 'node:crypto'
import { buildPrivateQueryHash, getPrivateResourceIdentifier, isPrivateCacheRoute } from '~~/server/utils/privateCacheKey'

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
  '/api/v1/public/quiz/general/leaderboard',
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
const CACHE_ALERTS_KEY = buildCacheKey({
  scope: 'system',
  resource: 'cache',
  identifier: 'alerts',
})
const REDIS_UNAVAILABLE_ALERT_KEY = 'redis.unavailable'
const CACHE_HIT_RATE_ALERT_DROP = 0.2

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT'])
const endpoint401Counts = new Map<string, number>()

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

type CacheResource = 'profile' | 'conversations' | 'notifications' | 'events' | 'posts'
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

const isProfileIdentityMutation = (path: string, method: string) => {
  if (path.startsWith('/api/v1/profile/photo') && method === 'POST') {
    return true
  }

  if (path.startsWith('/api/v1/users/me/profile') && (method === 'PATCH' || method === 'PUT')) {
    return true
  }

  return (method === 'PATCH' || method === 'PUT')
    && (path.startsWith('/api/v1/profile') || path.startsWith('/api/v1/users/me'))
}

const CACHE_RESOURCE_POLICIES: CacheResourcePolicy[] = [
  {
    name: 'profile',
    ttlSeconds: THREE_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/profile') || path.startsWith('/api/v1/users/me'),
    invalidationRules: [
      {
        event: 'profile.update',
        when: isProfileIdentityMutation,
        cachePrefixes: ['/api/v1/profile', '/api/v1/users/me', '/api/v1/notifications', '/api/v1/chat/private/conversations'],
      },
    ],
  },
  {
    name: 'conversations',
    ttlSeconds: TWO_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/chat/private/conversations'),
    invalidationRules: [
      {
        event: 'conversations.mutation',
        when: (path, method) => MUTATION_METHODS.has(method) && path.startsWith('/api/v1/chat/private/conversations'),
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
        event: 'notifications.mutation',
        when: (path, method) => MUTATION_METHODS.has(method) && path.startsWith('/api/v1/notifications'),
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
    name: 'posts',
    ttlSeconds: TEN_MINUTES_IN_SECONDS,
    isMatch: path => path.startsWith('/api/v1/private/blogs') || path.startsWith('/api/v1/public/blogs') || path.startsWith('/api/v1/blogs') || path.startsWith('/api/v1/blog/') || path.startsWith('/api/v1/private/stories'),
    invalidationRules: [
      {
        event: 'posts.publish_or_update_or_delete',
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
  const queryHash = buildPrivateQueryHash(query)
  const privateResource = getPrivateResourceIdentifier(path)

  return buildCacheKey({
    scope: 'private',
    resource: userId,
    identifier: `${privateResource}:${queryHash}`,
  })
}

const getCacheResourcePolicy = (path: string) => CACHE_RESOURCE_POLICIES.find(policy => policy.isMatch(path))

const getEntityCacheTtl = (path: string) => getCacheResourcePolicy(path)?.ttlSeconds || ONE_DAY_IN_SECONDS

const getCacheMetricField = (resource: CacheResource | 'generic', field: string) => `${resource}.${field}`

const recordRedisLatency = async (resource: CacheResource | 'generic', operation: 'read' | 'write' | 'invalidate', durationMs: number) => {
  const countField = getCacheMetricField(resource, `redisLatency.${operation}.count`)
  const sumField = getCacheMetricField(resource, `redisLatency.${operation}.sumMs`)

  try {
    const redis = await getRedisClient()
    await redis.hIncrBy(CACHE_METRICS_KEY, countField, 1)
    await redis.hIncrByFloat(CACHE_METRICS_KEY, sumField, durationMs)
  } catch (error) {
    console.warn('Redis latency metric write failed', error)
  }
}

const clearRedisUnavailableAlert = async () => {
  try {
    const redis = await getRedisClient()
    await redis.hDel(CACHE_ALERTS_KEY, REDIS_UNAVAILABLE_ALERT_KEY)
  } catch {
    // noop
  }
}

const raiseCacheAlert = async (alertKey: string, payload: Record<string, unknown>) => {
  const alert = {
    ...payload,
    key: alertKey,
    createdAt: new Date().toISOString(),
  }

  console.warn('[cache.alert]', alert)

  try {
    const redis = await getRedisClient()
    await redis.hSet(CACHE_ALERTS_KEY, alertKey, JSON.stringify(alert))
  } catch (error) {
    console.warn('Cache alert write failed', error)
  }
}

const evaluateCacheHitRateAlert = async (resource: CacheResource | 'generic') => {
  const hitField = getCacheMetricField(resource, 'hit')
  const missField = getCacheMetricField(resource, 'miss')

  try {
    const redis = await getRedisClient()
    const metrics = await redis.hmGet(CACHE_METRICS_KEY, [hitField, missField])
    const hits = Number(metrics[0] || 0)
    const misses = Number(metrics[1] || 0)
    const total = hits + misses

    if (total < 20) {
      return
    }

    const hitRate = hits / total
    if (hitRate >= CACHE_HIT_RATE_ALERT_DROP) {
      return
    }

    await raiseCacheAlert(`${resource}.hit_rate_drop`, {
      resource,
      type: 'hit_rate_drop',
      hitRate,
      hits,
      misses,
      threshold: CACHE_HIT_RATE_ALERT_DROP,
    })
  } catch (error) {
    console.warn('Cache hit-rate evaluation failed', error)
  }
}

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

  if (metric === 'miss' || metric === 'hit') {
    await evaluateCacheHitRateAlert(resource)
  }
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
  options: {
    requiresUserContext?: boolean
    userId?: string
    resource?: CacheResource | 'generic'
    requestId?: string
    targetPath?: string
  } = {},
) => {
  if (options.requiresUserContext && !options.userId) {
    return null
  }

  const metricResource = options.resource || 'generic'

  const redisReadStart = performance.now()

  try {
    const redis = await getRedisClient()
    await clearRedisUnavailableAlert()
    const cachedValue = await redis.get(cacheKey)
    const redisReadDuration = Number((performance.now() - redisReadStart).toFixed(2))
    await recordRedisLatency(metricResource, 'read', redisReadDuration)

    if (!cachedValue) {
      await recordCacheMetric(metricResource, 'miss', cacheKey)
      console.info('[cache.lookup]', {
        requestId: options.requestId || null,
        path: options.targetPath || null,
        label,
        status: 'cache_miss',
        redisLatencyMs: redisReadDuration,
      })
      return null
    }

    await recordCacheMetric(metricResource, 'hit', cacheKey)
    console.info('[cache.lookup]', {
      requestId: options.requestId || null,
      path: options.targetPath || null,
      label,
      status: 'cache_hit',
      redisLatencyMs: redisReadDuration,
    })
    return JSON.parse(cachedValue)
  } catch (error) {
    await raiseCacheAlert(REDIS_UNAVAILABLE_ALERT_KEY, {
      type: 'redis_unavailable',
      reason: 'cache_read_failed',
      label,
    })
    console.warn(`${label} cache read failed`, error)
    await recordCacheMetric(metricResource, 'miss', `${cacheKey}:read-failed`)
    return null
  }
}

const writeCache = async (cacheKey: string, payload: unknown, ttl: number, label: string, resource: CacheResource | 'generic' = 'generic') => {
  const redisWriteStart = performance.now()

  try {
    const redis = await getRedisClient()
    await clearRedisUnavailableAlert()
    await redis.set(cacheKey, JSON.stringify(payload), {
      EX: ttl,
    })
    const redisWriteDuration = Number((performance.now() - redisWriteStart).toFixed(2))
    await recordRedisLatency(resource, 'write', redisWriteDuration)
  } catch (error) {
    await raiseCacheAlert(REDIS_UNAVAILABLE_ALERT_KEY, {
      type: 'redis_unavailable',
      reason: 'cache_write_failed',
      label,
    })
    console.warn(`${label} cache write failed`, error)
  }
}

const clearCacheByPrefix = async (prefix: string) => {
  try {
    const redis = await getRedisClient()
    const { resource, identifier } = toPathResourceIdentifier(prefix)
    const pattern = buildCacheScanPattern({
      scope: isPrivateCacheRoute(prefix) ? 'private' : 'public',
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

const clearPrivateCacheByUserAndPrefix = async (userId: string | undefined, prefix: string) => {
  if (!userId) {
    return 0
  }

  try {
    const redis = await getRedisClient()
    const privateResource = getPrivateResourceIdentifier(prefix)
    const pattern = buildCacheScanPattern({
      scope: 'private',
      resource: userId,
      identifierPattern: `${privateResource}*`,
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
    console.warn('Private cache invalidation failed', error)
    return 0
  }
}

const invalidateUserProfile = async (userId?: string) => {
  const deletedByProfile = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/profile')
  const deletedByUsersMe = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/users/me')
  await recordCacheMetric('profile', 'invalidate', `profile:${deletedByProfile + deletedByUsersMe}`)
}

const invalidateConversations = async (userId?: string) => {
  const deleted = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/chat/private/conversations')
  await recordCacheMetric('conversations', 'invalidate', `conversations:${deleted}`)
}

const invalidateNotifications = async (userId?: string) => {
  const deleted = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/notifications')
  await recordCacheMetric('notifications', 'invalidate', `notifications:${deleted}`)
}

const invalidateEvents = async () => {
  const deleted = await clearCacheByPrefix('/api/v1/events')
  await recordCacheMetric('events', 'invalidate', `events:${deleted}`)
}

const invalidatePosts = async (userId?: string) => {
  const deletedPrivateBlogs = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/private/blogs')
  const deletedPrivateStories = await clearPrivateCacheByUserAndPrefix(userId, '/api/v1/private/stories')
  const deletedPublic = await clearPublicCacheByTag('blog:*')
  await recordCacheMetric('posts', 'invalidate', `posts:${deletedPrivateBlogs + deletedPrivateStories + deletedPublic}`)
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

const getResourceInvalidationActions = (targetPath: string, method: string, userId?: string) => {
  const actions: Array<() => Promise<void>> = []

  const addAction = (resource: CacheResource) => {
    if (resource === 'profile') {
      actions.push(() => invalidateUserProfile(userId))
      return
    }

    if (resource === 'conversations') {
      actions.push(() => invalidateConversations(userId))
      return
    }

    if (resource === 'notifications') {
      actions.push(() => invalidateNotifications(userId))
      return
    }

    if (resource === 'events') {
      actions.push(invalidateEvents)
      return
    }

    actions.push(() => invalidatePosts(userId))
  }

  for (const policy of CACHE_RESOURCE_POLICIES) {
    const shouldInvalidate = policy.invalidationRules.some(rule => rule.when(targetPath, method))
    if (shouldInvalidate) {
      addAction(policy.name)
    }
  }

  return actions
}

const getAuthenticatedUserIdFromSession = (authCookiePayload?: Record<string, any>) => {
  const candidate = authCookiePayload?.userSnapshot?.id
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate)
  }

  return undefined
}

const buildForwardHeaders = (event: any, requestCorrelationId: string): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: getHeader(event, 'accept') || 'application/json',
    'x-session-correlation-id': requestCorrelationId,
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

const logApiTelemetry = (
  level: 'info' | 'warn',
  payload: {
    path: string
    isPrivate: boolean
    authState: string
    attempt: number
    responseStatus: number | string
    errorSource: string | null
    sessionCorrelationId: string | null
    method: string
    event?: string
    [key: string]: unknown
  },
) => {
  const logger = level === 'warn' ? console.warn : console.info
  logger('[api-telemetry]', payload)
}

const recordTop401Endpoints = (
  targetPath: string,
  method: string,
  source: 'local_401' | 'backend_401',
  sessionCorrelationId: string | null,
) => {
  const key = `${method} ${targetPath} [${source}]`
  endpoint401Counts.set(key, (endpoint401Counts.get(key) || 0) + 1)
  const total401 = Array.from(endpoint401Counts.values()).reduce((sum, count) => sum + count, 0)

  if (total401 % 10 !== 0) {
    return
  }

  const topEndpoints = Array
    .from(endpoint401Counts.entries())
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .map(([endpointKey, count]) => ({ endpointKey, count }))

  console.warn('[api-telemetry][401-top-endpoints]', {
    total401,
    topEndpoints,
    sessionCorrelationId,
  })
}

const handleBackendError = (
  error: any,
  context: {
    targetPath: string
    method: string
    isPrivate: boolean
    authState: string
    hasAuthCookie: boolean
    hasBearerToken: boolean
    sessionCorrelationId: string | null
  },
) => {
  const statusCode = error?.statusCode || error?.response?.status
  const isNetworkError = !statusCode

  logApiTelemetry('warn', {
    path: context.targetPath,
    isPrivate: context.isPrivate,
    authState: context.authState,
    method: context.method,
    attempt: 1,
    responseStatus: statusCode || 'network_error',
    errorSource: isNetworkError ? 'network' : 'backend',
    hasAuthCookie: context.hasAuthCookie,
    hasBearerToken: context.hasBearerToken,
    errorType: isNetworkError ? 'network_error' : 'http_error',
    sessionCorrelationId: context.sessionCorrelationId,
  })

  if (statusCode === 401 || statusCode === 403) {
    recordTop401Endpoints(context.targetPath, context.method, 'backend_401', context.sessionCorrelationId)
    logApiTelemetry('warn', {
      event: 'api.error.401.backend',
      path: context.targetPath,
      isPrivate: context.isPrivate,
      authState: context.authState,
      method: context.method,
      attempt: 1,
      responseStatus: statusCode,
      errorSource: 'backend',
      sessionCorrelationId: context.sessionCorrelationId,
    })
    throw createError({
      statusCode,
      statusMessage: error?.statusMessage || (statusCode === 401 ? 'Unauthorized' : 'Forbidden'),
      data: {
        ...(error?.data || {}),
        source: 'backend',
        errorSource: 'backend',
        telemetryCategory: 'backend_401',
        sessionCorrelationId: context.sessionCorrelationId,
      },
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
  const requestCorrelationId = getHeader(event, 'x-session-correlation-id') || randomUUID()
  const sessionCorrelationId = requestCorrelationId
  setHeader(event, 'x-session-correlation-id', requestCorrelationId)
  const isPublicRoute = PUBLIC_BACKEND_PATHS.has(targetPath)
    || PUBLIC_BACKEND_PATH_PREFIXES.some(prefix => targetPath.startsWith(prefix))
  const isPrivate = !isPublicRoute

  const tokenFromAuthorizationHeader = normalizeBearerToken(getHeader(event, 'authorization'))
  let bearerToken: string | undefined = tokenFromAuthorizationHeader
  let authCookiePayload = !isPublicRoute
    ? await readAuthCookie(event) || undefined
    : undefined
  const authState = bearerToken
    ? 'authorization_header'
    : (authCookiePayload ? 'cookie' : 'missing')

  if (!isPublicRoute && !bearerToken && !authCookiePayload) {
    recordTop401Endpoints(targetPath, getMethod(event), 'local_401', sessionCorrelationId)
    logApiTelemetry('warn', {
      event: 'api.error.401.local',
      path: targetPath,
      isPrivate,
      authState,
      method: getMethod(event),
      attempt: 1,
      responseStatus: 401,
      errorSource: 'local',
      hasAuthCookie: false,
      hasBearerToken: false,
      errorType: 'gateway_auth_not_ready',
      sessionCorrelationId,
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'AUTH_NOT_READY',
      data: {
        code: 'SESSION_MISSING',
        errorSource: 'local',
        source: 'gateway',
        telemetryCategory: 'gateway_auth_not_ready',
        sessionCorrelationId,
      },
    })
  }

  if (!bearerToken && authCookiePayload) {
    bearerToken = authCookiePayload.token
  }

  const authenticatedUserId = getAuthenticatedUserIdFromSession(authCookiePayload as Record<string, any> | undefined)

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
    const cachedPayload = await readCache(publicRouteCacheSpec.cacheKey, 'Public route', { requestId: requestCorrelationId, targetPath })

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  if (shouldCacheLocalization) {
    const cacheKey = getLocalizationCacheKey(targetPath, query)
    const cachedPayload = await readCache(cacheKey, 'Localization', { requestId: requestCorrelationId, targetPath })

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  if (shouldCacheEntity) {
    const isPrivateRoute = isPrivateCacheRoute(targetPath)
    const resourcePolicy = getCacheResourcePolicy(targetPath)
    const privateCacheUserIdResolved = !isPrivateRoute || Boolean(authenticatedUserId)
    if (isPrivateRoute) {
      console.info('[cache.private.user-context]', {
        requestId: requestCorrelationId,
        path: targetPath,
        privateCacheUserIdResolved,
      })
    }
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
          requestId: requestCorrelationId,
          targetPath,
        })
      : null

    if (cachedPayload !== null) {
      return cachedPayload
    }
  }

  try {
    const headers = buildForwardHeaders(event, requestCorrelationId)

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    console.info('[cache.lookup]', {
      requestId: requestCorrelationId,
      path: targetPath,
      status: 'backend_fetch',
      reason: 'cache_miss_or_bypass',
    })

    const response = await $fetch(targetPath, {
      method,
      baseURL: config.public.apiBase,
      query,
      body,
      headers,
    })

    logApiTelemetry('info', {
      path: targetPath,
      isPrivate,
      authState: bearerToken ? authState : (authCookiePayload ? 'cookie' : 'missing'),
      method,
      attempt: 1,
      responseStatus: '2xx',
      errorSource: null,
      hasAuthCookie: Boolean(authCookiePayload),
      hasBearerToken: Boolean(bearerToken),
      sessionCorrelationId,
    })

    if (publicRouteCacheSpec) {
      await writeCache(publicRouteCacheSpec.cacheKey, response, publicRouteCacheSpec.ttl, 'Public route', 'generic')
    }

    if (shouldCacheLocalization) {
      const cacheKey = getLocalizationCacheKey(targetPath, query)
      await writeCache(cacheKey, response, ONE_YEAR_IN_SECONDS, 'Localization', 'generic')
    }

    if (shouldCacheEntity) {
      const isPrivateRoute = isPrivateCacheRoute(targetPath)
      const resourcePolicy = getCacheResourcePolicy(targetPath)
      const privateCacheUserIdResolved = !isPrivateRoute || Boolean(authenticatedUserId)
      if (isPrivateRoute) {
        console.info('[cache.private.user-context]', {
          requestId: requestCorrelationId,
          path: targetPath,
          privateCacheUserIdResolved,
        })
      }
      const cacheKey = isPrivateRoute
        ? (authenticatedUserId ? getPrivateCacheKey(targetPath, query, authenticatedUserId) : undefined)
        : (targetPath.startsWith('/api/v1/users/me') && bearerToken
            ? getUsersMeCacheKey(targetPath, query, bearerToken)
            : getEntityCacheKey(targetPath, query))

      if (cacheKey) {
        await writeCache(cacheKey, response, getEntityCacheTtl(targetPath), resourcePolicy ? `Entity:${resourcePolicy.name}` : 'Entity', resourcePolicy?.name || 'generic')
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
      const resourceInvalidationActions = getResourceInvalidationActions(targetPath, method, authenticatedUserId)
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
    handleBackendError(error, {
      targetPath,
      method,
      isPrivate,
      authState: bearerToken ? 'bearer' : (authCookiePayload ? 'cookie' : 'missing'),
      hasAuthCookie: Boolean(authCookiePayload),
      hasBearerToken: Boolean(bearerToken),
      sessionCorrelationId,
    })
  }
})
