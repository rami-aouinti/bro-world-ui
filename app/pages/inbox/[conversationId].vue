<script setup lang="ts">
import type { PrivateChatMessage } from '~/types/api/chat'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const route = useRoute()
const privateChatApi = usePrivateChatApi()
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
    const response = await privateChatApi.getConversationMessages(conversationId.value)
    selectedConversationMessages.value = [...(response.items ?? [])]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
