import { useNotificationsApi } from '~/composables/api/useNotificationsApi'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { useInboxStore } from '~/stores/inbox'
import { useNotificationsStore } from '~/stores/notifications'

let activeBootstrapPromise: Promise<void> | null = null
let activeResyncPromise: Promise<void> | null = null
let isRealtimeBootstrapOrchestratorInitialized = false

const createCorrelationId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const useRealtimeBootstrap = () => {
  const authSession = useAuthSessionStore()
  const { initSession, isAuthenticated, authState } = useAuth()
  const notificationsApi = useNotificationsApi()
  const privateChatApi = usePrivateChatApi()
  const notificationsStore = useNotificationsStore()
  const inboxStore = useInboxStore()

  const bootstrappedUserId = useState<string | null>('realtime-bootstrap-user-id', () => null)

  const fetchRealtimeResources = async (reason: 'bootstrap' | 'mercure-reconnect') => {
    const correlationId = createCorrelationId(reason)
    console.info(`[realtime][${correlationId}] start notifications+conversations sync`, {
      reason,
      userId: authSession.profile?.id ?? null,
    })

    const notifications = await notificationsApi.getNotifications(100, 0)
    notificationsStore.setNotifications(notifications)

    const conversations = await privateChatApi.getConversations(20, 1)
    inboxStore.setConversations(conversations)

    console.info(`[realtime][${correlationId}] done notifications+conversations sync`, {
      notificationsCount: notifications.items?.length ?? 0,
      conversationsCount: conversations.items?.length ?? 0,
    })
  }

  const bootstrap = async () => {
    await initSession()

    const canCallPrivateEndpoints = (authState.value === 'authenticated' || authState.value === 'degraded') && Boolean(authSession.profile?.id)
    if (!canCallPrivateEndpoints || !isAuthenticated.value || !authSession.profile?.id) {
      return
    }

    if (bootstrappedUserId.value === authSession.profile.id && activeBootstrapPromise) {
      await activeBootstrapPromise
      return
    }

    if (bootstrappedUserId.value === authSession.profile.id) {
      return
    }

    activeBootstrapPromise = (async () => {
      await fetchRealtimeResources('bootstrap')
      bootstrappedUserId.value = authSession.profile?.id ?? null
    })()

    try {
      await activeBootstrapPromise
    }
    finally {
      activeBootstrapPromise = null
    }
  }

  const resyncAfterMercureReconnect = async () => {
    await initSession()

    const canCallPrivateEndpoints = (authState.value === 'authenticated' || authState.value === 'degraded') && Boolean(authSession.profile?.id)
    if (!canCallPrivateEndpoints || !isAuthenticated.value || !authSession.profile?.id) {
      return
    }

    if (activeResyncPromise) {
      await activeResyncPromise
      return
    }

    activeResyncPromise = fetchRealtimeResources('mercure-reconnect')

    try {
      await activeResyncPromise
    }
    finally {
      activeResyncPromise = null
    }
  }

  if (!isRealtimeBootstrapOrchestratorInitialized) {
    isRealtimeBootstrapOrchestratorInitialized = true

    watch(
      () => ({
        authenticated: isAuthenticated.value,
        userId: authSession.profile?.id ?? null,
      }),
      async ({ authenticated, userId }) => {
        if (!authenticated || !userId) {
          bootstrappedUserId.value = null
          notificationsStore.clear()
          inboxStore.invalidateCache()
          return
        }

        await bootstrap()
      },
      { immediate: true },
    )
  }

  return {
    bootstrap,
    resyncAfterMercureReconnect,
  }
}
