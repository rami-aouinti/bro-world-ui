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
const isLoadingConversation = ref(false)
const selectedConversationMessages = ref<PrivateChatMessage[]>([])

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
    await initSession()

    const canCallPrivateEndpoint = authState.value === 'authenticated' || authState.value === 'degraded'
    if (!canCallPrivateEndpoint) {
      selectedConversationMessages.value = []
      return
    }

    selectedConversationMessages.value = await inboxStore.fetchConversationMessages(conversationId.value)
  }
  catch {
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
  <InboxContent
    :selected-conversation-id="conversationId"
    :selected-conversation-messages="selectedConversationMessages"
    :is-conversation-loading="isLoadingConversation"
  />
</template>
