<script setup lang="ts">
import type { PrivateChatConversation } from '~/types/api/chat'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const route = useRoute()
const conversationId = computed(() => {
  const raw = route.params.conversationId
  return typeof raw === 'string' ? raw : null
})

const { data: cachedConversation } = useAsyncData<PrivateChatConversation | null>(
  'inbox-selected-conversation-cache',
  () => {
    if (!conversationId.value) {
      return Promise.resolve(null)
    }

    return $fetch<PrivateChatConversation | null>(`/api/inbox/conversations/${conversationId.value}`, {
      method: 'GET',
    })
  },
  {
    watch: [conversationId],
  },
)
</script>

<template>
  <InboxContent
    :selected-conversation-id="conversationId"
    :cached-conversation="cachedConversation"
  />
</template>
