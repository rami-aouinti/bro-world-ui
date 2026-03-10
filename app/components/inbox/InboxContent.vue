<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import ConversationAvatarGroup from '~/components/inbox/ConversationAvatarGroup.vue'
import type { PrivateChatConversation, PrivateChatMessage, PrivateConversationsResponse } from '~/types/api/chat'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'

const props = defineProps<{
  selectedConversationId?: string | null
}>()

const router = useRouter()
const authSession = useAuthSessionStore()
const privateChatApi = usePrivateChatApi()

const { data: inboxConversationsSummary } = useAsyncData<PrivateConversationsResponse>(
  'inbox-conversations',
  () => privateChatApi.getConversations(20, 1),
  {
    default: () => ({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
      },
      filters: [],
    }),
    watch: [() => authSession.profile?.id],
    immediate: Boolean(authSession.profile),
  },
)

const getLatestMessage = (conversation: PrivateChatConversation): PrivateChatMessage | null => {
  if (!conversation.messages.length) {
    return null
  }

  return [...conversation.messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
}

const conversations = computed(() => (inboxConversationsSummary.value?.items ?? [])
  .map((conversation) => {
    const lastMessage = getLatestMessage(conversation)
    const participants = conversation.participants
      .filter(participant => !participant.user.owner)
      .map(participant => ({
        id: participant.user.id,
        label: `${participant.user.firstName} ${participant.user.lastName}`.trim() || 'Utilisateur',
        photo: participant.user.photo,
      }))

    return {
      id: conversation.id,
      participants,
      title: participants[0]?.label ?? 'Conversation',
      excerpt: lastMessage?.content ?? 'Aucun message',
      unread: conversation.unreadMessagesCount,
      lastMessageAt: lastMessage?.createdAt ?? conversation.createdAt,
      messages: [...conversation.messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }
  })
  .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()))

const activeConversation = computed(() => {
  if (!conversations.value.length) {
    return null
  }

  if (props.selectedConversationId) {
    return conversations.value.find(item => item.id === props.selectedConversationId) ?? conversations.value[0] ?? null
  }

  return conversations.value[0] ?? null
})

const formatMessageDate = (value: string) => new Date(value).toLocaleString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: 'short',
})

const goToConversation = async (conversationId: string) => {
  await router.push(`/inbox/${conversationId}`)
}

const me = computed(() => authSession.profile?.id)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Inbox"
        subtitle="Messagerie"
      />

      <div class="d-flex align-center justify-space-between mb-3">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Conversations</h2>
        <UiStatChip :value="conversations.length" color="primary" />
      </div>

      <v-list class="bg-transparent pa-0" nav>
        <v-list-item
          v-for="conversation in conversations"
          :key="conversation.id"
          :active="activeConversation?.id === conversation.id"
          rounded="lg"
          class="mb-2 inbox-page__conversation"
          @click="goToConversation(conversation.id)"
        >
          <template #prepend>
            <ConversationAvatarGroup :participants="conversation.participants" :size="40" />
          </template>

          <v-list-item-title class="font-weight-medium">{{ conversation.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ conversation.excerpt }}</v-list-item-subtitle>

          <template #append>
            <v-badge
              v-if="conversation.unread > 0"
              :content="conversation.unread"
              color="primary"
              inline
            />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="activeConversation">
      <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ activeConversation.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">Conversation active</p>
        </div>
      </div>

      <div class="inbox-page__messages mb-2">
        <div
          v-for="message in activeConversation.messages"
          :key="message.id"
          class="inbox-page__bubble"
          :class="message.sender.id === me ? 'inbox-page__bubble--me' : 'inbox-page__bubble--other'"
        >
          <p class="text-caption text-medium-emphasis mb-1">{{ message.sender.firstName }} {{ message.sender.lastName }} • {{ formatMessageDate(message.createdAt) }}</p>
          <p class="text-body-2 mb-0">{{ message.content }}</p>
        </div>
      </div>
    </template>

    <UiStateEmptyState
      v-else
      title="Aucune conversation sélectionnée"
      description="Choisissez une conversation à gauche pour afficher les messages."
      icon="mdi-email-open-outline"
    />
  </PlatformSplitLayout>
</template>

<style scoped>
.inbox-page__conversation {
  transition: background-color 0.2s ease;
}

.inbox-page__conversation:hover,
.inbox-page__conversation:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.inbox-page__messages {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inbox-page__bubble {
  border-radius: 14px;
  padding: 0.75rem 1rem;
  max-width: 92%;
}

.inbox-page__bubble--other {
  background: rgba(var(--v-theme-primary), 0.08);
}

.inbox-page__bubble--me {
  background: rgba(var(--v-theme-surface-variant), 0.65);
  margin-left: auto;
}
</style>
