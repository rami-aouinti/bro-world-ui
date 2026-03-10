import { useApiClient } from '../useApiClient'
import type {
  CreatePrivateMessagePayload,
  CreatePrivateReactionPayload,
  PrivateConversationsResponse,
  PrivateConversationMessagesResponse,
  PrivateChatConversation,
  PrivateChatMessage,
  PrivateChatReaction,
  UpdatePrivateConversationPayload,
  UpdatePrivateMessagePayload,
  UpdatePrivateReactionPayload,
} from '~/types/api/chat'

export const usePrivateChatApi = () => {
  const { apiFetch } = useApiClient()
  const conversationsBasePath = '/api/v1/chat/private/conversations'
  const messagesBasePath = '/api/v1/chat/private/messages'
  const reactionsBasePath = '/api/v1/chat/private/reactions'

  return {
    getConversations(limit = 20, page = 1) {
      return apiFetch<PrivateConversationsResponse>(conversationsBasePath, {
        method: 'GET',
        query: {
          limit,
          page,
        },
      })
    },

    getConversationMessages(conversationId: string) {
      return apiFetch<PrivateConversationMessagesResponse>(`${conversationsBasePath}/${conversationId}`, {
        method: 'GET',
      })
    },

    deleteConversation(conversationId: string) {
      return apiFetch<void>(`${conversationsBasePath}/${conversationId}`, {
        method: 'DELETE',
      })
    },

    updateConversation(conversationId: string, body: UpdatePrivateConversationPayload) {
      return apiFetch<PrivateChatConversation>(`${conversationsBasePath}/${conversationId}`, {
        method: 'PATCH',
        body,
      })
    },

    markConversationAsReadAll(conversationId: string) {
      return apiFetch<PrivateChatConversation>(`${conversationsBasePath}/${conversationId}/messages/read`, {
        method: 'POST',
      })
    },

    addMessage(conversationId: string, body: CreatePrivateMessagePayload) {
      return apiFetch<PrivateChatMessage>(`${conversationsBasePath}/${conversationId}/messages`, {
        method: 'POST',
        body,
      })
    },

    deleteMessage(messageId: string) {
      return apiFetch<void>(`${messagesBasePath}/${messageId}`, {
        method: 'DELETE',
      })
    },

    updateMessage(messageId: string, body: UpdatePrivateMessagePayload) {
      return apiFetch<PrivateChatMessage>(`${messagesBasePath}/${messageId}`, {
        method: 'PATCH',
        body,
      })
    },

    addReaction(messageId: string, body: CreatePrivateReactionPayload) {
      return apiFetch<PrivateChatReaction>(`${messagesBasePath}/${messageId}/reactions`, {
        method: 'POST',
        body,
      })
    },

    deleteReaction(reactionId: string) {
      return apiFetch<void>(`${reactionsBasePath}/${reactionId}`, {
        method: 'DELETE',
      })
    },

    updateReaction(reactionId: string, body: UpdatePrivateReactionPayload) {
      return apiFetch<PrivateChatReaction>(`${reactionsBasePath}/${reactionId}`, {
        method: 'PATCH',
        body,
      })
    },
  }
}
