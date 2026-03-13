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

export const useInboxStore = defineStore('inbox', () => {
  const privateChatApi = usePrivateChatApi()
  const conversationsCache = useState<{ data: PrivateConversationsResponse | null, cachedAt: number }>('inbox-conversations-cache', () => ({
    data: null,
    cachedAt: 0,
  }))
  const messagesCache = useState<Record<string, { items: PrivateChatMessage[], cachedAt: number }>>('inbox-messages-cache', () => ({}))

  const isConversationsCacheFresh = (force = false) => !force
    && conversationsCache.value.data
    && Date.now() - conversationsCache.value.cachedAt < CACHE_TTL_MS

  const isMessagesCacheFresh = (conversationId: string, force = false) => !force
    && messagesCache.value[conversationId]
    && Date.now() - messagesCache.value[conversationId].cachedAt < CACHE_TTL_MS

  const fetchConversations = async (force = false) => {
    if (isConversationsCacheFresh(force) && conversationsCache.value.data) {
      return conversationsCache.value.data
    }

    const data = await privateChatApi.getConversations(20, 1)
    conversationsCache.value = {
      data,
      cachedAt: Date.now(),
    }
    return data
  }

  const fetchConversationMessages = async (conversationId: string, force = false) => {
    if (isMessagesCacheFresh(conversationId, force)) {
      return messagesCache.value[conversationId].items
    }

    const response = await privateChatApi.getConversationMessages(conversationId)
    const items = [...(response.items ?? [])]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    messagesCache.value[conversationId] = {
      items,
      cachedAt: Date.now(),
    }

    return items
  }

  const invalidateCache = (conversationId?: string) => {
    conversationsCache.value = {
      data: null,
      cachedAt: 0,
    }

    if (conversationId) {
      delete messagesCache.value[conversationId]
    }
    else {
      messagesCache.value = {}
    }

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
    messagesCache,
    fetchConversations,
    fetchConversationMessages,
    invalidateCache,
    addMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    updateReaction,
    deleteReaction,
  }
})
