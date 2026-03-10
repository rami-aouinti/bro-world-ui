import { requireAuthCookie } from '~~/server/utils/authCookie'
import { buildCacheScanPattern } from '~~/server/utils/cacheKeyBuilder'
import { getRedisClient } from '~~/server/utils/redis'
import type { PrivateChatConversation } from '~~/app/types/api/chat'

interface PrivateConversationsResponse {
  items: PrivateChatConversation[]
}

const CONVERSATIONS_CACHE_PATTERN = buildCacheScanPattern({
  scope: 'private',
  resource: 'chat',
  identifierPattern: 'private.conversations*',
})

const readConversationFromRedis = async (conversationId: string) => {
  const redis = await getRedisClient()

  for await (const key of redis.scanIterator({ MATCH: CONVERSATIONS_CACHE_PATTERN, COUNT: 100 })) {
    const cachedValue = await redis.get(String(key))
    if (!cachedValue) {
      continue
    }

    const payload = JSON.parse(cachedValue) as PrivateConversationsResponse
    const found = payload?.items?.find(item => item.id === conversationId)

    if (found) {
      return found
    }
  }

  return null
}

export default defineEventHandler(async (event) => {
  const conversationId = getRouterParam(event, 'conversationId')

  if (!conversationId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversationId' })
  }

  await requireAuthCookie(event)

  const cachedConversation = await readConversationFromRedis(conversationId)
  if (cachedConversation) {
    return cachedConversation
  }

  const requestFetch = useRequestFetch()
  const requestHeaders = useRequestHeaders(['cookie'])
  const response = await requestFetch<PrivateConversationsResponse>('/api/backend/api/v1/chat/private/conversations', {
    method: 'GET',
    query: {
      limit: 20,
      page: 1,
    },
    headers: {
      ...requestHeaders,
    },
  })

  return response.items.find(item => item.id === conversationId) ?? null
})
