<script setup lang="ts">
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { PrivateChatConversation } from '~/types/api/chat'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const privateChatApi = usePrivateChatApi()

const noPluginDataMessage = 'Aucune API de chat publique liée à cette application n\'est disponible pour le moment.'

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
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le chat de cette platform.</v-alert>
    <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />

    <template v-else>
      <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
        {{ noPluginDataMessage }} Connectez-vous pour consulter vos conversations privées.
      </v-alert>

      <v-alert v-else-if="!conversations?.length" type="info" variant="tonal" class="mb-4">
        Aucune conversation disponible pour le moment.
      </v-alert>

      <v-list v-else lines="two" density="comfortable" class="rounded-lg border">
        <v-list-item
          v-for="conversation in conversations"
          :key="conversation.id"
          :title="`Conversation #${conversation.id.slice(0, 8)}`"
          :subtitle="`${conversation.unreadMessagesCount} message(s) non lu(s)`"
        >
          <template #append>
            <v-chip size="small" variant="tonal">{{ conversation.participants.length }} participant(s)</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </template>
  </PlatformPluginPageShell>
</template>
