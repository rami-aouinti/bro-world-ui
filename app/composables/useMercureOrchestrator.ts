import type { PrivateChatMessage } from '~/types/api/chat'
import { useMercureEventSource } from '~/composables/useMercureEventSource'
import { useInboxStore } from '~/stores/inbox'
import { useNotificationsStore } from '~/stores/notifications'

export const useMercureOrchestrator = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()
  const notificationsStore = useNotificationsStore()
  const inboxStore = useInboxStore()

  const inboxConversationsSummary = computed(() => inboxStore.conversationsSummary)

  const mercureTopics = computed(() => {
    if (!isAuthenticated.value || !authSession.profile?.id) {
      return []
    }

    return [
      `/users/${authSession.profile.id}/notifications`,
      ...(inboxConversationsSummary.value?.items ?? []).map(conversation => `/conversations/${conversation.id}/messages`),
    ]
  })

  const isNotificationPayload = (payload: unknown): payload is {
    id: string
    title: string
    description?: string
    type: string
  } => {
    if (!payload || typeof payload !== 'object') {
      return false
    }

    const candidate = payload as Record<string, unknown>
    return typeof candidate.id === 'string'
      && typeof candidate.title === 'string'
      && typeof candidate.type === 'string'
  }

  const isConversationMessagePayload = (payload: unknown): payload is {
    id: string
    conversationId: string
    senderId: string
    content: string
    createdAt?: string
    attachments?: unknown
  } => {
    if (!payload || typeof payload !== 'object') {
      return false
    }

    const candidate = payload as Record<string, unknown>
    return typeof candidate.id === 'string'
      && typeof candidate.conversationId === 'string'
      && typeof candidate.senderId === 'string'
      && typeof candidate.content === 'string'
  }

  const resolveConversationSender = (conversationId: string, senderId: string): PrivateChatMessage['sender'] => {
    const profile = authSession.profile

    if (profile?.id === senderId) {
      return {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        photo: profile.photo,
        owner: true,
      }
    }

    const conversation = inboxConversationsSummary.value?.items.find(item => item.id === conversationId)
    const participant = conversation?.participants.find(item => item.user.id === senderId)?.user

    if (participant) {
      return participant
    }

    return {
      id: senderId,
      firstName: 'Utilisateur',
      lastName: '',
      photo: null,
      owner: false,
    }
  }

  const normalizeAttachments = (attachments: unknown) => {
    if (!attachments) {
      return []
    }

    return Array.isArray(attachments) ? attachments : [attachments]
  }

  useMercureEventSource(mercureTopics, (payload) => {
    if (!isAuthenticated.value || !authSession.profile?.id) {
      return
    }

    if (isConversationMessagePayload(payload)) {
      inboxStore.applyIncomingMessage(payload.conversationId, {
        id: payload.id,
        content: payload.content,
        sender: resolveConversationSender(payload.conversationId, payload.senderId),
        attachments: normalizeAttachments(payload.attachments),
        read: false,
        readAt: null,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        reactions: [],
      }, authSession.profile.id)
      return
    }

    if (!isNotificationPayload(payload)) {
      return
    }

    notificationsStore.prependNotification({
      id: payload.id,
      title: payload.title,
      description: payload.description ?? '',
      type: payload.type,
      read: false,
      createdAt: new Date().toISOString(),
      from: null,
    })
  })
}
