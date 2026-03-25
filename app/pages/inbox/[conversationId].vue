<script setup lang="ts">
import type { PrivateChatMessage } from '~/types/api/chat'
import { useInboxStore } from '~/stores/inbox'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const route = useRoute()
const inboxStore = useInboxStore()
const { initSession, authState } = useAuth()
const { resolveSensitiveError, isDebugMode } = useSensitivePageFeedback()
const isLoadingConversation = ref(false)
const selectedConversationMessages = ref<PrivateChatMessage[]>([])
const loadError = ref('')
const loadErrorRequestId = ref<string | null>(null)

const conversationId = computed(() => {
  const raw = route.params.conversationId
  return typeof raw === 'string' ? raw : null
})

const loadConversationMessages = async () => {
  if (!conversationId.value) {
    selectedConversationMessages.value = []
    return
  }

  try {
    isLoadingConversation.value = true
    loadError.value = ''
    loadErrorRequestId.value = null
    await initSession()

    const canCallPrivateEndpoint = authState.value === 'authenticated' || authState.value === 'degraded'
    if (!canCallPrivateEndpoint) {
      selectedConversationMessages.value = []
      const authGateError = authState.value === 'unauthenticated'
        ? { statusCode: 401, data: { errorCode: 'AUTH_REQUIRED', errorSource: 'client_auth_guard' } }
        : { statusCode: 403, data: { errorCode: 'AUTH_NOT_READY', errorSource: 'client_auth_guard' } }
      const resolved = resolveSensitiveError(authGateError, {
        authState: authState.value,
      })
      loadError.value = resolved.message
      return
    }

    selectedConversationMessages.value = await inboxStore.fetchConversationMessages(conversationId.value)
  }
  catch (error) {
    const resolved = resolveSensitiveError(error, { authState: authState.value })
    loadError.value = resolved.message
    loadErrorRequestId.value = resolved.requestId
    selectedConversationMessages.value = []
  }
  finally {
    isLoadingConversation.value = false
  }
}

onMounted(loadConversationMessages)

watch(conversationId, async (current, previous) => {
  if (current !== previous) {
    await loadConversationMessages()
  }
})
</script>

<template>
  <div>
    <v-alert v-if="loadError" type="warning" variant="tonal" class="mb-4">
      {{ loadError }}
      <div v-if="isDebugMode && loadErrorRequestId" class="text-caption mt-1">requestId: {{ loadErrorRequestId }}</div>
    </v-alert>
    <InboxContent
      :selected-conversation-id="conversationId"
      :selected-conversation-messages="selectedConversationMessages"
      :is-conversation-loading="isLoadingConversation"
    />
  </div>
</template>
