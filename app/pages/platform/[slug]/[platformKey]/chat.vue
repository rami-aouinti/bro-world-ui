<script setup lang="ts">
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { PrivateChatConversation } from '~/types/api/chat'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const privateChatApi = usePrivateChatApi()
const { t } = useI18n()

const noPluginDataMessage = computed(() => t('platform.chat.noPublicApi'))

const { data: conversations, pending, error, execute: loadChat } = useAsyncData(
  () => `application-chat-${slug.value}-${isAuthenticated.value ? 'private' : 'public'}`,
  async () => {
    if (!isAuthenticated.value) {
      return [] as PrivateChatConversation[]
    }

    const response = await privateChatApi.getConversations(10, 1)
    return response.items ?? []
  },
  {
    watch: [slug, isAuthenticated],
    server: false,
    immediate: false,
    default: () => [] as PrivateChatConversation[],
  },
)

onMounted(() => {
  void loadChat()
})
</script>

<template>
  <PlatformPluginPageShell title="Chat" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ t('platform.chat.loadError') }}</v-alert>
    <v-skeleton-loader v-else-if="pending" type="list-item-two-line@5" class="mb-4" />

    <template v-else>
      <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
        {{ noPluginDataMessage }} {{ t('platform.chat.signInHint') }}
      </v-alert>

      <v-alert v-else-if="!conversations?.length" type="info" variant="tonal" class="mb-4">
        {{ t('platform.chat.noConversation') }}
      </v-alert>

      <v-list v-else lines="two" density="comfortable" class="rounded-lg border">
        <v-list-item
          v-for="conversation in conversations"
          :key="conversation.id"
          :title="`Conversation #${conversation.id.slice(0, 8)}`"
          :subtitle="`${conversation.unreadMessagesCount} ${t('platform.chat.unreadMessages')}`"
        >
          <template #append>
            <v-chip size="small" variant="tonal">{{ conversation.participants.length }} participant(s)</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </template>
  </PlatformPluginPageShell>
</template>
