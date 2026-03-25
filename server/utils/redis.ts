import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null
const REDIS_CONNECT_TIMEOUT_MS = 1_000
let redisAvailabilityLogged = false

const connectWithTimeout = async (client: ReturnType<typeof createClient>) => {
  await Promise.race([
    client.connect(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Redis connection timeout after ${REDIS_CONNECT_TIMEOUT_MS}ms`))
      }, REDIS_CONNECT_TIMEOUT_MS)
    }),
  ])
}

export const getRedisClient = async () => {
  const config = useRuntimeConfig()

  if (!config.redisUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'REDIS_URL (or NUXT_REDIS_URL) is not configured',
    })
  }

  if (!redisClient) {
    redisClient = createClient({
      url: config.redisUrl,
    })

    redisClient.on('error', (error) => {
      console.error('Redis error', error)
    })
  }

  if (!redisClient.isOpen) {
    try {
      await connectWithTimeout(redisClient)
    } catch (error) {
      redisClient.disconnect().catch(() => undefined)
      redisClient = null
      throw error
    }
  }

  return redisClient
}

export const checkRedisCacheHealth = async () => {
  const config = useRuntimeConfig()
  const cacheContext = {
    cacheEnv: config.cacheEnv,
    cacheApp: config.cacheApp,
    cacheVersion: config.cacheVersion,
  }

  if (!config.redisUrl) {
    if (!redisAvailabilityLogged) {
      console.warn('Redis cache disabled', {
        reason: 'missing REDIS_URL/NUXT_REDIS_URL',
        ...cacheContext,
      })
      redisAvailabilityLogged = true
    }

    return false
  }

  try {
    await getRedisClient()

    if (!redisAvailabilityLogged) {
      console.info('Redis cache enabled', cacheContext)
      redisAvailabilityLogged = true
    }

    return true
  } catch (error) {
    if (!redisAvailabilityLogged) {
      console.warn('Redis cache disabled', {
        reason: 'connection_failed',
        ...cacheContext,
        error,
      })
      redisAvailabilityLogged = true
    }

    return false
  }
}
