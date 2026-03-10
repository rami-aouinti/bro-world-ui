<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import ConversationAvatarGroup from '~/components/inbox/ConversationAvatarGroup.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import type { PrivateChatConversation, PrivateChatMessage, PrivateConversationsResponse } from '~/types/api/chat'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'

const props = withDefaults(defineProps<{
  selectedConversationId?: string | null
  selectedConversationMessages?: PrivateChatMessage[]
  isConversationLoading?: boolean
}>(), {
  selectedConversationId: null,
  selectedConversationMessages: () => [],
  isConversationLoading: false,
})

const router = useRouter()
const authSession = useAuthSessionStore()
const privateChatApi = usePrivateChatApi()
const draftMessage = ref('')
const isSendingMessage = ref(false)
const isUpdatingMessage = ref(false)
const isDeletingMessage = ref(false)
const messagesContainerRef = ref<HTMLElement | null>(null)
const editingMessage = ref<PrivateChatMessage | null>(null)
const editDialog = ref(false)
const deleteDialog = ref(false)
const messageToDelete = ref<PrivateChatMessage | null>(null)
const editContent = ref('')
const conversationMessages = ref<PrivateChatMessage[]>([])
const readingConversationIds = ref<Set<string>>(new Set())

const availableReactions = [
  { value: 'like', icon: '👍', label: 'Like' },
  { value: 'love', icon: '❤️', label: 'Love' },
  { value: 'laugh', icon: '😂', label: 'Laugh' },
  { value: 'wow', icon: '😮', label: 'Wow' },
  { value: 'sad', icon: '😢', label: 'Sad' },
]

const { data: inboxConversationsSummary, refresh: refreshInboxConversations } = useAsyncData<PrivateConversationsResponse>(
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

const mapConversation = (conversation: PrivateChatConversation) => {
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
}

const conversations = computed(() => (inboxConversationsSummary.value?.items ?? [])
  .map(mapConversation)
  .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()))


watch(
  () => props.selectedConversationMessages,
  (messages) => {
    conversationMessages.value = [...(messages ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },
  { immediate: true, deep: true },
)

const activeConversation = computed(() => {
  if (props.selectedConversationId) {
    const selected = conversations.value.find(item => item.id === props.selectedConversationId)
    if (selected) {
      return {
        ...selected,
        messages: conversationMessages.value.length
          ? conversationMessages.value
          : selected.messages,
      }
    }
  }

  return conversations.value[0] ?? null
})

const formatMessageDate = (value: string) => new Date(value).toLocaleString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: 'short',
})

const reactionIconByValue: Record<string, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
}

const getMessageReactionPreview = (message: PrivateChatMessage) => {
  const latestReaction = message.reactions?.[message.reactions.length - 1]
  if (!latestReaction) {
    return null
  }

  return reactionIconByValue[latestReaction.reaction] ?? latestReaction.reaction
}

const markConversationAsReadIfNeeded = async (conversationId: string) => {
  const conversation = conversations.value.find(item => item.id === conversationId)

  if (!conversation || conversation.unread <= 0 || readingConversationIds.value.has(conversationId)) {
    return
  }

  try {
    readingConversationIds.value.add(conversationId)
    await privateChatApi.markConversationAsReadAll(conversationId)

    if (inboxConversationsSummary.value) {
      inboxConversationsSummary.value.items = inboxConversationsSummary.value.items.map(item =>
        item.id === conversationId
          ? {
              ...item,
              unreadMessagesCount: 0,
              messages: item.messages.map(message => message.read
                ? message
                : {
                    ...message,
                    read: true,
                    readAt: message.readAt ?? new Date().toISOString(),
                  }),
            }
          : item)
    }

    if (props.selectedConversationId === conversationId) {
      conversationMessages.value = conversationMessages.value.map(message => message.read
        ? message
        : {
            ...message,
            read: true,
            readAt: message.readAt ?? new Date().toISOString(),
          })
    }
  }
  finally {
    readingConversationIds.value.delete(conversationId)
  }
}

const goToConversation = async (conversationId: string) => {
  await router.push(`/inbox/${conversationId}`)
}

const me = computed(() => authSession.profile?.id)

const scrollMessagesToBottom = () => {
  const container = messagesContainerRef.value
  if (!container) {
    return
  }

  container.scrollTop = container.scrollHeight
}

watch(
  () => [activeConversation.value?.id, activeConversation.value?.messages.length, props.isConversationLoading],
  async () => {
    await nextTick()
    if (!props.isConversationLoading) {
      scrollMessagesToBottom()
    }
  },
  { immediate: true },
)

const refreshConversationData = async () => {
  clearNuxtData('inbox-conversations')
  await refreshInboxConversations()

  if (props.selectedConversationId) {
    const response = await privateChatApi.getConversationMessages(props.selectedConversationId)
    conversationMessages.value = [...(response.items ?? [])]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
}

const sendMessage = async () => {
  const conversationId = activeConversation.value?.id
  const content = draftMessage.value.trim()

  if (!conversationId || !content || isSendingMessage.value) {
    return
  }

  try {
    isSendingMessage.value = true

    await privateChatApi.addMessage(conversationId, { content })
    draftMessage.value = ''
    await refreshConversationData()

    await nextTick()
    scrollMessagesToBottom()
  }
  finally {
    isSendingMessage.value = false
  }
}

watch(
  () => [activeConversation.value?.id, activeConversation.value?.unread, props.isConversationLoading],
  async ([conversationId, unread, isConversationLoading]) => {
    if (!conversationId || isConversationLoading || !unread) {
      return
    }

    await markConversationAsReadIfNeeded(conversationId)
  },
  { immediate: true },
)

const addReaction = async (messageId: string, reaction: string) => {
  await privateChatApi.addReaction(messageId, { reaction })
  await refreshConversationData()
}

const openEditDialog = (message: PrivateChatMessage) => {
  editingMessage.value = message
  editContent.value = message.content
  editDialog.value = true
}

const updateMessage = async () => {
  if (!editingMessage.value || !editContent.value.trim()) {
    return
  }

  try {
    isUpdatingMessage.value = true
    await privateChatApi.updateMessage(editingMessage.value.id, {
      content: editContent.value.trim(),
    })
    editDialog.value = false
    await refreshConversationData()
  }
  finally {
    isUpdatingMessage.value = false
  }
}

const openDeleteDialog = (message: PrivateChatMessage) => {
  messageToDelete.value = message
  deleteDialog.value = true
}

const deleteMessage = async () => {
  if (!messageToDelete.value) {
    return
  }

  try {
    isDeletingMessage.value = true
    await privateChatApi.deleteMessage(messageToDelete.value.id)
    deleteDialog.value = false
    await refreshConversationData()
  }
  finally {
    isDeletingMessage.value = false
  }
}
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
      <section class="inbox-page__content">
        <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
          <div>
            <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ activeConversation.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">Conversation active</p>
          </div>
        </div>

        <div v-if="isConversationLoading" class="inbox-page__messages mb-2">
          <v-skeleton-loader
            v-for="index in 6"
            :key="`message-skeleton-${index}`"
            type="article"
          />
        </div>

        <div v-else ref="messagesContainerRef" class="inbox-page__messages mb-2">
          <div
            v-for="message in activeConversation.messages"
            :key="message.id"
            class="inbox-page__bubble"
            :class="message.sender.id === me ? 'inbox-page__bubble--me' : 'inbox-page__bubble--other'"
          >
            <UiAvatar
              :name="`${message.sender.firstName} ${message.sender.lastName}`"
              :src="message.sender.photo ?? undefined"
              size="32"
              class="inbox-page__bubble-avatar"
            />

            <div class="inbox-page__bubble-main">
              <div class="d-flex justify-space-between align-start ga-2">
              <p class="text-caption text-medium-emphasis mb-1">
                {{ message.sender.firstName }} {{ message.sender.lastName }} • {{ formatMessageDate(message.createdAt) }}
              </p>

              <div class="d-flex align-center ga-1">
                <v-menu location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon="mdi-emoticon-outline"
                      size="x-small"
                      variant="text"
                    />
                  </template>

                  <v-list density="compact">
                    <v-list-item
                      v-for="reaction in availableReactions"
                      :key="`${message.id}-${reaction.value}`"
                      @click="addReaction(message.id, reaction.value)"
                    >
                      <v-list-item-title>{{ reaction.icon }} {{ reaction.label }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <v-menu v-if="message.sender.id === me" location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon="mdi-dots-vertical"
                      size="x-small"
                      variant="text"
                    />
                  </template>

                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil" title="Modifier" @click="openEditDialog(message)" />
                    <v-list-item prepend-icon="mdi-delete" title="Supprimer" base-color="error" @click="openDeleteDialog(message)" />
                  </v-list>
                </v-menu>
              </div>
            </div>

              <p class="text-body-2 mb-0">{{ message.content }}</p>

              <div v-if="getMessageReactionPreview(message)" class="inbox-page__reaction-preview">
                {{ getMessageReactionPreview(message) }}
              </div>
            </div>
          </div>
        </div>

        <div class="inbox-page__composer pt-2">
          <v-textarea
            v-model="draftMessage"
            label="Votre message"
            placeholder="Écrire un message..."
            rows="2"
            auto-grow
            max-rows="5"
            variant="outlined"
            hide-details
            density="comfortable"
          />
          <div class="d-flex justify-end mt-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-send"
              :loading="isSendingMessage"
              :disabled="!draftMessage.trim()"
              @click="sendMessage"
            >
              Envoyer
            </v-btn>
          </div>
        </div>
      </section>
    </template>

    <UiStateEmptyState
      v-else
      title="Aucune conversation sélectionnée"
      description="Choisissez une conversation à gauche pour afficher les messages."
      icon="mdi-email-open-outline"
    />

    <v-dialog v-model="editDialog" max-width="560">
      <v-card>
        <v-card-title>Modifier le message</v-card-title>
        <v-card-text>
          <v-textarea v-model="editContent" rows="3" variant="solo-filled" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="isUpdatingMessage" @click="updateMessage">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Supprimer ce message ?</v-card-title>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" :loading="isDeletingMessage" @click="deleteMessage">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.inbox-page__content {
  height: 100%;
  max-height: calc(100vh - var(--app-split-shell-appbar-height) - var(--app-split-shell-margin) * 2);
  display: flex;
  flex-direction: column;
}

.inbox-page__messages {
  min-height: 260px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

.inbox-page__composer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.inbox-page__bubble {
  border-radius: 14px;
  padding: 0.75rem 1rem;
  max-width: 92%;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.inbox-page__bubble-main {
  flex: 1;
  position: relative;
  padding-bottom: 0.5rem;
}

.inbox-page__bubble-avatar {
  flex-shrink: 0;
}

.inbox-page__reaction-preview {
  position: absolute;
  right: -0.25rem;
  bottom: -0.55rem;
  font-size: 1rem;
  line-height: 1;
}

.inbox-page__bubble--other {
  background: rgba(var(--v-theme-primary), 0.08);
}

.inbox-page__bubble--me {
  background: rgba(var(--v-theme-surface-variant), 0.65);
  margin-left: auto;
}
</style>
