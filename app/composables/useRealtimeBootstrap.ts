import { useNotificationsApi } from '~/composables/api/useNotificationsApi'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { useInboxStore } from '~/stores/inbox'
import { useNotificationsStore } from '~/stores/notifications'

let activeBootstrapPromise: Promise<void> | null = null

export const useRealtimeBootstrap = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()
  const notificationsApi = useNotificationsApi()
  const privateChatApi = usePrivateChatApi()
  const notificationsStore = useNotificationsStore()
  const inboxStore = useInboxStore()

  const bootstrappedUserId = useState<string | null>('realtime-bootstrap-user-id', () => null)

  const bootstrap = async () => {
    if (!isAuthenticated.value || !authSession.profile?.id) {
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
      const [notifications, conversations] = await Promise.all([
        notificationsApi.getNotifications(100, 0),
        privateChatApi.getConversations(20, 1),
      ])

      notificationsStore.setNotifications(notifications)
      inboxStore.setConversations(conversations)
      bootstrappedUserId.value = authSession.profile?.id ?? null
    })()

    try {
      await activeBootstrapPromise
    }
    finally {
      activeBootstrapPromise = null
    }
  }

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

  return { bootstrap }
}
