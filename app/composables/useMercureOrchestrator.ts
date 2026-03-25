import { useMercureEventSource } from '~/composables/useMercureEventSource'
import { useRealtimeBootstrap } from '~/composables/useRealtimeBootstrap'
import { useInboxStore } from '~/stores/inbox'

export const useMercureOrchestrator = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()
  const { resyncAfterMercureReconnect } = useRealtimeBootstrap()
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

  useMercureEventSource(
    mercureTopics,
    {
      onReconnect: () => {
        if (!isAuthenticated.value || !authSession.profile?.id) {
          return
        }

        void resyncAfterMercureReconnect()
      },
    },
  )
}
