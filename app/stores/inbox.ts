import { defineStore } from 'pinia'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import type {
  CreatePrivateMessagePayload,
  CreatePrivateReactionPayload,
  PrivateChatMessage,
  PrivateConversationsResponse,
  UpdatePrivateMessagePayload,
  UpdatePrivateReactionPayload,
} from '~/types/api/chat'

const CACHE_TTL_MS = 60_000

const EMPTY_CONVERSATIONS_RESPONSE: PrivateConversationsResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  },
  filters: [],
}

export const useInboxStore = defineStore('inbox', () => {
  const privateChatApi = usePrivateChatApi()
  const conversationsCache = useState<{ data: PrivateConversationsResponse | null, cachedAt: number }>('inbox-conversations-cache', () => ({
    data: null,
    cachedAt: 0,
  }))
  const messagesCache = useState<Record<string, { items: PrivateChatMessage[], cachedAt: number }>>('inbox-messages-cache', () => ({}))
  const conversationsInFlight = useState<Promise<PrivateConversationsResponse> | null>('inbox-conversations-inflight', () => null)
  const messagesInFlight = useState<Record<string, Promise<PrivateChatMessage[]>>>('inbox-messages-inflight', () => ({}))

  const conversationsSummary = computed<PrivateConversationsResponse>(() => conversationsCache.value.data ?? EMPTY_CONVERSATIONS_RESPONSE)

  const isConversationsCacheFresh = (force = false) => !force
    && conversationsCache.value.data
    && Date.now() - conversationsCache.value.cachedAt < CACHE_TTL_MS

  const isMessagesCacheFresh = (conversationId: string, force = false) => !force
    && messagesCache.value[conversationId]
    && Date.now() - messagesCache.value[conversationId].cachedAt < CACHE_TTL_MS

  const setConversations = (data: PrivateConversationsResponse) => {
    conversationsCache.value = {
      data,
      cachedAt: Date.now(),
    }
  }

  const fetchConversations = async (force = false) => {
    if (isConversationsCacheFresh(force) && conversationsCache.value.data) {
      return conversationsCache.value.data
    }

    if (conversationsInFlight.value) {
      return conversationsInFlight.value
    }

    conversationsInFlight.value = privateChatApi.getConversations(20, 1)
      .then((data) => {
        setConversations(data)
        return data
      })
      .finally(() => {
        conversationsInFlight.value = null
      })

    return conversationsInFlight.value
  }

  const fetchConversationMessages = async (conversationId: string, force = false) => {
    if (isMessagesCacheFresh(conversationId, force)) {
      return messagesCache.value[conversationId].items
    }

    if (messagesInFlight.value[conversationId]) {
      return messagesInFlight.value[conversationId]
    }

    messagesInFlight.value[conversationId] = privateChatApi.getConversationMessages(conversationId)
      .then((response) => {
        const items = [...(response.items ?? [])]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        messagesCache.value[conversationId] = {
          items,
          cachedAt: Date.now(),
        }

        return items
      })
      .finally(() => {
        delete messagesInFlight.value[conversationId]
      })

    return messagesInFlight.value[conversationId]
  }

  const applyIncomingMessage = (conversationId: string, message: PrivateChatMessage, currentUserId?: string | null) => {
    const existingCache = messagesCache.value[conversationId]
    const existingMessage = existingCache?.items.some(item => item.id === message.id)

    if (!existingMessage) {
      messagesCache.value[conversationId] = {
        items: [...(existingCache?.items ?? []), message],
        cachedAt: Date.now(),
      }
    }

    if (!conversationsCache.value.data) {
      return
    }

    conversationsCache.value = {
      ...conversationsCache.value,
      data: {
        ...conversationsCache.value.data,
        items: conversationsCache.value.data.items.map((conversation) => {
          if (conversation.id !== conversationId || conversation.messages.some(item => item.id === message.id)) {
            return conversation
          }

          return {
            ...conversation,
            messages: [...conversation.messages, message],
            unreadMessagesCount: message.sender.id === currentUserId
              ? conversation.unreadMessagesCount
              : conversation.unreadMessagesCount + 1,
          }
        }),
      },
    }
  }

  const invalidateCache = (conversationId?: string) => {
    conversationsCache.value = {
      data: null,
      cachedAt: 0,
    }

    if (conversationId) {
      delete messagesCache.value[conversationId]
      delete messagesInFlight.value[conversationId]
    }
    else {
      messagesCache.value = {}
      messagesInFlight.value = {}
    }

    conversationsInFlight.value = null
    clearNuxtData('inbox-conversations')
  }

  const addMessage = async (conversationId: string, payload: CreatePrivateMessagePayload) => {
    const created = await privateChatApi.addMessage(conversationId, payload)
    invalidateCache(conversationId)
    return created
  }

  const updateMessage = async (conversationId: string, messageId: string, payload: UpdatePrivateMessagePayload) => {
    const updated = await privateChatApi.updateMessage(messageId, payload)
    invalidateCache(conversationId)
    return updated
  }

  const deleteMessage = async (conversationId: string, messageId: string) => {
    await privateChatApi.deleteMessage(messageId)
    invalidateCache(conversationId)
  }

  const addReaction = async (conversationId: string, messageId: string, payload: CreatePrivateReactionPayload) => {
    const created = await privateChatApi.addReaction(messageId, payload)
    invalidateCache(conversationId)
    return created
  }

  const updateReaction = async (conversationId: string, reactionId: string, payload: UpdatePrivateReactionPayload) => {
    const updated = await privateChatApi.updateReaction(reactionId, payload)
    invalidateCache(conversationId)
    return updated
  }

  const deleteReaction = async (conversationId: string, reactionId: string) => {
    await privateChatApi.deleteReaction(reactionId)
    invalidateCache(conversationId)
  }

  return {
    conversationsCache,
    conversationsSummary,
    messagesCache,
    setConversations,
    fetchConversations,
    fetchConversationMessages,
    applyIncomingMessage,
    invalidateCache,
    addMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    updateReaction,
    deleteReaction,
  }
})
