import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export const getRedisClient = async () => {
  const config = useRuntimeConfig()

  if (!config.redisUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'REDIS_URL is not configured',
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
    await redisClient.connect()
  }

  return redisClient
}
