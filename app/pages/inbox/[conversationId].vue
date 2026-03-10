<script setup lang="ts">
definePageMeta({
  public: false,
  requiresAuth: true,
})

const route = useRoute()

const conversationId = computed(() => {
  const raw = route.params.conversationId
  return typeof raw === 'string' ? raw : null
})
</script>

<template>
  <InboxContent :selected-conversation-id="conversationId" />
</template>
