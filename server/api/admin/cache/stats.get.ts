import { getRedisClient } from '~~/server/utils/redis'
import { buildCacheKey } from '~~/server/utils/cacheKeyBuilder'

type CacheResource = 'profile' | 'conversations' | 'notifications' | 'events' | 'posts' | 'generic'

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

const RESOURCES: CacheResource[] = ['profile', 'conversations', 'notifications', 'events', 'posts', 'generic']

const toNumber = (value: string | null | undefined) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const getLatencyAvg = (metrics: Record<string, string>, resource: CacheResource, operation: 'read' | 'write' | 'invalidate') => {
  const count = toNumber(metrics[`${resource}.redisLatency.${operation}.count`])
  const sumMs = toNumber(metrics[`${resource}.redisLatency.${operation}.sumMs`])

  if (!count) {
    return 0
  }

  return Number((sumMs / count).toFixed(2))
}

export default defineEventHandler(async () => {
  const redis = await getRedisClient()
  const [rawMetrics, rawAlerts] = await Promise.all([
    redis.hGetAll(CACHE_METRICS_KEY),
    redis.hGetAll(CACHE_ALERTS_KEY),
  ])

  const resources = RESOURCES.map((resource) => {
    const hit = toNumber(rawMetrics[`${resource}.hit`])
    const miss = toNumber(rawMetrics[`${resource}.miss`])
    const invalidate = toNumber(rawMetrics[`${resource}.invalidate`])
    const total = hit + miss

    return {
      resource,
      hit,
      miss,
      hitRate: total ? Number(((hit / total) * 100).toFixed(2)) : 0,
      missRate: total ? Number(((miss / total) * 100).toFixed(2)) : 0,
      invalidations: invalidate,
      redisLatencyMs: {
        read: getLatencyAvg(rawMetrics, resource, 'read'),
        write: getLatencyAvg(rawMetrics, resource, 'write'),
        invalidate: getLatencyAvg(rawMetrics, resource, 'invalidate'),
      },
    }
  })

  const alerts = Object.values(rawAlerts)
    .map((value) => {
      try {
        return JSON.parse(value)
      }
      catch {
        return null
      }
    })
    .filter(Boolean)

  return {
    generatedAt: new Date().toISOString(),
    resources,
    alerts,
  }
})
