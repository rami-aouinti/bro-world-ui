import type { PrivateChatMessage } from '~/types/api/chat'
import { computed, onBeforeUnmount, watch, type Ref } from 'vue'
import { useInboxStore } from '~/stores/inbox'
import { useNotificationsStore } from '~/stores/notifications'

type MercureConnectionLifecycle = {
  onReconnect?: () => void
}

type SubscriptionEntry = {
  topics: Set<string>
}

let mercureEventSource: EventSource | null = null
let activeTopicsKey = ''
let nextSubscriptionId = 0
let mercureHasOpenedAtLeastOnce = false
let shouldNotifyReconnectOnNextOpen = false

const subscriptions = new Map<number, SubscriptionEntry>()
const subscriptionLifecycles = new Map<number, MercureConnectionLifecycle>()

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

const normalizeAttachments = (attachments: unknown) => {
  if (!attachments) {
    return []
  }

  return Array.isArray(attachments) ? attachments : [attachments]
}

const getActiveTopics = () => {
  const topics = new Set<string>()

  subscriptions.forEach(({ topics: subscriptionTopics }) => {
    subscriptionTopics.forEach(topic => topics.add(topic))
  })

  return [...topics].sort((a, b) => a.localeCompare(b))
}

const closeEventSource = () => {
  if (!mercureEventSource) {
    return
  }

  mercureEventSource.close()
  mercureEventSource = null
  activeTopicsKey = ''
  mercureHasOpenedAtLeastOnce = false
  shouldNotifyReconnectOnNextOpen = false
}

const createMessageDispatcher = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()
  const notificationsStore = useNotificationsStore()
  const inboxStore = useInboxStore()

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

    const conversation = inboxStore.conversationsSummary?.items.find(item => item.id === conversationId)
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

  return (payload: unknown) => {
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
  }
}

const connectEventSource = () => {
  if (!import.meta.client) {
    return
  }

  const config = useRuntimeConfig()
  const topics = getActiveTopics()
  const nextTopicsKey = topics.join('|')

  if (!topics.length) {
    closeEventSource()
    return
  }

  if (mercureEventSource && nextTopicsKey === activeTopicsKey) {
    return
  }

  closeEventSource()

  const dispatchMessage = createMessageDispatcher()
  const url = new URL(config.public.mercurePublicUrl)
  topics.forEach(topic => url.searchParams.append('topic', topic))

  const source = new EventSource(url.toString(), { withCredentials: false })

  source.onopen = () => {
    if (mercureHasOpenedAtLeastOnce && shouldNotifyReconnectOnNextOpen) {
      subscriptions.forEach((_entry, id) => {
        const lifecycle = subscriptionLifecycles.get(id)
        lifecycle?.onReconnect?.()
      })
      shouldNotifyReconnectOnNextOpen = false
    }

    mercureHasOpenedAtLeastOnce = true
  }

  source.onmessage = (event) => {
    let payload: unknown = event.data

    try {
      payload = JSON.parse(event.data)
    }
    catch {
      payload = event.data
    }

    dispatchMessage(payload)
  }

  source.onerror = () => {
    if (mercureHasOpenedAtLeastOnce) {
      shouldNotifyReconnectOnNextOpen = true
    }
  }

  mercureEventSource = source
  activeTopicsKey = nextTopicsKey
}

const registerTopics = (subscriptionId: number, topics: string[]) => {
  const subscription = subscriptions.get(subscriptionId)

  if (!subscription) {
    return
  }

  subscription.topics = new Set(topics.filter(Boolean))
  connectEventSource()
}

const unregisterTopics = (subscriptionId: number) => {
  subscriptions.delete(subscriptionId)
  subscriptionLifecycles.delete(subscriptionId)
  connectEventSource()
}

export const useMercureEventSource = (
  topics: Ref<string[]>,
  lifecycle: MercureConnectionLifecycle = {},
) => {
  const subscriptionId = ++nextSubscriptionId

  subscriptions.set(subscriptionId, {
    topics: new Set(),
  })
  subscriptionLifecycles.set(subscriptionId, lifecycle)

  const deduplicatedTopics = computed(() => [...new Set(topics.value.filter(Boolean))])

  const stopWatchingTopics = watch(
    deduplicatedTopics,
    (nextTopics) => {
      registerTopics(subscriptionId, nextTopics)
    },
    { immediate: true },
  )

  const close = () => {
    stopWatchingTopics()
    unregisterTopics(subscriptionId)
  }

  onBeforeUnmount(close)

  return {
    close,
    reconnect: connectEventSource,
  }
}
