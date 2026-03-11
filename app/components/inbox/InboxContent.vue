<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import ConversationAvatarGroup from '~/components/inbox/ConversationAvatarGroup.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import type { PrivateChatConversation, PrivateChatMessage, PrivateConversationsResponse } from '~/types/api/chat'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { useMercureEventSource } from '~/composables/useMercureEventSource'

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


const fallbackSender = {
  id: 'unknown-user',
  firstName: 'Utilisateur',
  lastName: '',
  photo: null,
  owner: false,
}

const normalizeMessage = (message: Partial<PrivateChatMessage> & { id: string }): PrivateChatMessage => ({
  id: message.id,
  content: message.content ?? '',
  sender: message.sender ?? fallbackSender,
  attachments: message.attachments ?? [],
  read: message.read ?? false,
  readAt: message.readAt ?? null,
  createdAt: message.createdAt ?? new Date().toISOString(),
  reactions: message.reactions ?? [],
})

const sortMessages = (messages: PrivateChatMessage[]) => [...messages]
  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

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

type InboxConversation = ReturnType<typeof mapConversation> & {
  channel?: string
  sla?: string
}

const conversations = computed(() => (inboxConversationsSummary.value?.items ?? [])
  .map(mapConversation)
  .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()))

const formatRelativeTime = (value: string) => {
  const now = Date.now()
  const date = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((now - date) / 60000))

  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`
  }

  if (diffMinutes < 1440) {
    return `il y a ${Math.round(diffMinutes / 60)} h`
  }

  return `il y a ${Math.round(diffMinutes / 1440)} j`
}

const demoConversations = computed<InboxConversation[]>(() => {
  const now = Date.now()

  return [
    {
      id: 'demo-customer-success',
      title: 'Support Premium · Claire Martin',
      excerpt: 'Le client confirme la réception du devis et souhaite un appel demain.',
      unread: 3,
      channel: 'Support',
      sla: 'Réponse attendue sous 45 min',
      participants: [
        { id: 'demo-c1', label: 'Claire Martin', photo: null },
        { id: 'demo-c2', label: 'Adrien Lopez', photo: null },
      ],
      lastMessageAt: new Date(now - 12 * 60000).toISOString(),
      messages: [
        {
          id: 'demo-msg-1',
          content: 'Bonjour, je viens de transmettre la proposition commerciale au client.',
          sender: { id: 'demo-c2', firstName: 'Adrien', lastName: 'Lopez', photo: null, owner: false },
          attachments: [],
          read: true,
          readAt: new Date(now - 34 * 60000).toISOString(),
          createdAt: new Date(now - 35 * 60000).toISOString(),
          reactions: [],
        },
        {
          id: 'demo-msg-2',
          content: 'Merci, le client souhaite aussi une projection trimestrielle par produit.',
          sender: { id: 'demo-c1', firstName: 'Claire', lastName: 'Martin', photo: null, owner: false },
          attachments: [],
          read: false,
          readAt: null,
          createdAt: new Date(now - 20 * 60000).toISOString(),
          reactions: [{ id: 'demo-react-1', userId: 'demo-c2', reaction: 'like' }],
        },
      ],
    },
    {
      id: 'demo-sales-onboarding',
      title: 'Equipe Sales · Onboarding',
      excerpt: 'Checklist d’intégration mise à jour, reste la validation juridique.',
      unread: 1,
      channel: 'Interne',
      sla: 'Suivi prévu aujourd’hui',
      participants: [
        { id: 'demo-c3', label: 'Nina Park', photo: null },
        { id: 'demo-c4', label: 'Julien Perez', photo: null },
      ],
      lastMessageAt: new Date(now - 72 * 60000).toISOString(),
      messages: [
        {
          id: 'demo-msg-3',
          content: 'La documentation d’onboarding est publiée dans Notion.',
          sender: { id: 'demo-c3', firstName: 'Nina', lastName: 'Park', photo: null, owner: false },
          attachments: [],
          read: true,
          readAt: new Date(now - 91 * 60000).toISOString(),
          createdAt: new Date(now - 92 * 60000).toISOString(),
          reactions: [],
        },
      ],
    },
    {
      id: 'demo-ops-billing',
      title: 'Ops · Facturation EU',
      excerpt: 'Correction TVA en attente du retour finance (ticket #FIN-342).',
      unread: 0,
      channel: 'Finance',
      sla: 'Résolu à 80%',
      participants: [
        { id: 'demo-c5', label: 'Maël Roche', photo: null },
        { id: 'demo-c6', label: 'Lucia Vento', photo: null },
      ],
      lastMessageAt: new Date(now - 5 * 3600 * 1000).toISOString(),
      messages: [
        {
          id: 'demo-msg-4',
          content: 'Le batch de correction TVA est lancé, monitoring en cours.',
          sender: { id: 'demo-c6', firstName: 'Lucia', lastName: 'Vento', photo: null, owner: false },
          attachments: [],
          read: true,
          readAt: new Date(now - 4 * 3600 * 1000).toISOString(),
          createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
          reactions: [{ id: 'demo-react-2', userId: 'demo-c5', reaction: 'wow' }],
        },
      ],
    },
  ]
})

const visibleConversations = computed<InboxConversation[]>(() => conversations.value.length
  ? conversations.value
  : demoConversations.value)
const isUsingDemoData = computed(() => conversations.value.length === 0)

const inboxInsights = computed(() => {
  const total = visibleConversations.value.length
  const unread = visibleConversations.value.reduce((acc, conversation) => acc + conversation.unread, 0)
  const urgent = visibleConversations.value.filter(conversation => conversation.unread > 2).length

  return [
    { label: 'Conversations', value: total, icon: 'mdi-forum-outline', color: 'primary' },
    { label: 'Non lus', value: unread, icon: 'mdi-email-alert-outline', color: 'warning' },
    { label: 'Prioritaires', value: urgent, icon: 'mdi-clock-alert-outline', color: 'error' },
  ]
})


watch(
  () => props.selectedConversationMessages,
  (messages) => {
    conversationMessages.value = sortMessages((messages ?? []).map(item => normalizeMessage(item)))
  },
  { immediate: true, deep: true },
)

const activeConversation = computed(() => {
  if (props.selectedConversationId) {
    const selected = visibleConversations.value.find(item => item.id === props.selectedConversationId)
    if (selected) {
      return {
        ...selected,
        messages: conversationMessages.value.length
          ? conversationMessages.value
          : selected.messages,
      }
    }
  }

  return visibleConversations.value[0] ?? null
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
  if (isUsingDemoData.value) {
    return
  }

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

const mercureTopics = computed(() => {
  const topics: string[] = []

  if (authSession.profile?.id) {
    topics.push(`/users/${authSession.profile.id}/notifications`)
  }

  if (activeConversation.value?.id) {
    topics.push(`/conversations/${activeConversation.value.id}/messages`)
  }

  return topics
})

const isConversationMessagePayload = (payload: unknown): payload is {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt?: string
  attachments?: unknown
} => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.id === 'string'
    && typeof candidate.conversationId === 'string'
    && typeof candidate.senderId === 'string'
    && typeof candidate.content === 'string'
}

const resolveSenderFromPayload = (senderId: string) => {
  const profile = authSession.profile
  if (profile?.id === senderId) {
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      photo: profile.photo,
      owner: true,
    }
  }

  const conversation = inboxConversationsSummary.value?.items.find(item => item.id === activeConversation.value?.id)
  const participant = conversation?.participants.find(item => item.user.id === senderId)?.user

  if (participant) {
    return participant
  }

  return {
    id: senderId,
    firstName: 'Utilisateur',
    lastName: '',
    photo: null,
    owner: false,
  }
}

const normalizeAttachments = (attachments: unknown) => {
  if (!attachments) {
    return []
  }

  return Array.isArray(attachments) ? attachments : [attachments]
}

useMercureEventSource(mercureTopics, async (payload) => {
  if (isUsingDemoData.value || !isConversationMessagePayload(payload)) {
    return
  }

  if (payload.conversationId !== activeConversation.value?.id) {
    await refreshInboxConversations()
    return
  }

  if (conversationMessages.value.some(message => message.id === payload.id)) {
    return
  }

  conversationMessages.value = sortMessages([
    ...conversationMessages.value,
    normalizeMessage({
      id: payload.id,
      content: payload.content,
      sender: resolveSenderFromPayload(payload.senderId),
      attachments: normalizeAttachments(payload.attachments),
      read: false,
      readAt: null,
      createdAt: payload.createdAt ?? new Date().toISOString(),
      reactions: [],
    }),
  ])

  await refreshInboxConversations()

  await nextTick()
  scrollMessagesToBottom()
})

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
    conversationMessages.value = sortMessages((response.items ?? []).map(item => normalizeMessage(item)))
  }
}

const sendMessage = async () => {
  const conversationId = activeConversation.value?.id
  const content = draftMessage.value.trim()

  if (!conversationId || !content || isSendingMessage.value || isUsingDemoData.value) {
    return
  }

  try {
    isSendingMessage.value = true

    const createdMessage = await privateChatApi.addMessage(conversationId, { content })

    if (!conversationMessages.value.some(message => message.id === createdMessage.id)) {
      conversationMessages.value = sortMessages([...conversationMessages.value, normalizeMessage(createdMessage)])
    }

    draftMessage.value = ''
    await refreshInboxConversations()

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
  if (isUsingDemoData.value) {
    return
  }

  await privateChatApi.addReaction(messageId, { reaction })
  await refreshConversationData()
}

const openEditDialog = (message: PrivateChatMessage) => {
  editingMessage.value = message
  editContent.value = message.content
  editDialog.value = true
}

const updateMessage = async () => {
  if (isUsingDemoData.value) {
    return
  }

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
  if (isUsingDemoData.value) {
    return
  }

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
        subtitle="Centre de conversations"
      />

      <v-alert
        v-if="isUsingDemoData"
        type="info"
        variant="tonal"
        density="compact"
        icon="mdi-flask-outline"
        class="mb-3"
      >
        Données de démonstration enrichies actives (en attendant le backend).
      </v-alert>

      <div class="inbox-page__insights mb-4">
        <article v-for="insight in inboxInsights" :key="insight.label" class="inbox-page__insight-card">
          <v-icon :icon="insight.icon" :color="insight.color" size="20" />
          <div>
            <p class="text-caption text-medium-emphasis mb-0">{{ insight.label }}</p>
            <p class="text-subtitle-2 font-weight-bold mb-0">{{ insight.value }}</p>
          </div>
        </article>
      </div>

      <v-list class="bg-transparent pa-0" nav>
        <v-list-item
          v-for="conversation in visibleConversations"
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
          <div class="d-flex align-center ga-2 mt-1">
            <UiStatChip :value="conversation.channel ?? 'Chat'" color="default" />
            <span class="text-caption text-medium-emphasis">{{ formatRelativeTime(conversation.lastMessageAt) }}</span>
          </div>

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
            <p class="text-body-2 text-medium-emphasis mb-0">{{ activeConversation.sla ?? 'Conversation active' }}</p>
          </div>
          <UiStatChip :value="`${activeConversation.messages.length} messages`" color="primary" />
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
            :class="message.sender?.id === me ? 'inbox-page__bubble--me' : 'inbox-page__bubble--other'"
          >
            <UiAvatar
              :name="`${message.sender?.firstName ?? 'Utilisateur'} ${message.sender?.lastName ?? ''}`"
              :src="message.sender?.photo ?? undefined"
              size="sm"
              class="inbox-page__bubble-avatar"
            />

            <div class="inbox-page__bubble-main">
              <div class="d-flex justify-space-between align-start ga-2">
              <p class="text-caption text-medium-emphasis mb-1">
                {{ message.sender?.firstName ?? 'Utilisateur' }} {{ message.sender?.lastName ?? '' }} • {{ formatMessageDate(message.createdAt) }}
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

                <v-menu v-if="message.sender?.id === me" location="bottom end">
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
              :disabled="!draftMessage.trim() || isUsingDemoData"
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
  border: 1px solid transparent;
}

.inbox-page__conversation:hover,
.inbox-page__conversation:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.inbox-page__insights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.inbox-page__insight-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 0.5rem 0.625rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

@media (max-width: 860px) {
  .inbox-page__insights {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
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

:deep(.v-theme--dark .app-split-shell__left),
:deep(.v-theme--dark .app-split-shell__right) {
  background: transparent !important;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
</style>
