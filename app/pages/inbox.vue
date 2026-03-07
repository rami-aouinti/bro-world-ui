<script setup lang="ts">
import UiListCard from '~/components/ui/UiListCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'

definePageMeta({
  public: false,
  requiresAuth: true,
})

interface Conversation {
  id: number
  name: string
  excerpt: string
  lastMessageAt: string
  unread: number
  avatarColor: string
}

const conversations = ref<Conversation[]>([
  {
    id: 1,
    name: 'Équipe Produit',
    excerpt: 'On valide la roadmap demain matin.',
    lastMessageAt: '09:12',
    unread: 2,
    avatarColor: 'primary',
  },
  {
    id: 2,
    name: 'Support Clients',
    excerpt: '3 tickets urgents à traiter aujourd’hui.',
    lastMessageAt: 'Hier',
    unread: 0,
    avatarColor: 'success',
  },
  {
    id: 3,
    name: 'Design Guild',
    excerpt: 'Nouvelles maquettes disponibles sur Figma.',
    lastMessageAt: 'Lun',
    unread: 1,
    avatarColor: 'info',
  },
])

const activeConversationId = ref<number | null>(conversations.value[0]?.id ?? null)

const activeConversation = computed(() => conversations.value.find(item => item.id === activeConversationId.value) ?? null)

const messages = computed(() => {
  if (!activeConversation.value) {
    return []
  }

  return [
    {
      id: 1,
      author: activeConversation.value.name,
      content: 'Bonjour, voici les points à suivre pour cette semaine.',
      time: '09:10',
      fromMe: false,
    },
    {
      id: 2,
      author: 'Vous',
      content: 'Parfait, je partage un plan d’action dans la matinée.',
      time: '09:12',
      fromMe: true,
    },
  ]
})
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

      <v-btn color="primary" prepend-icon="mdi-pencil-outline" block class="mb-4">Nouveau message</v-btn>

      <v-list class="bg-transparent pa-0" nav>
        <v-list-item
          v-for="conversation in conversations"
          :key="conversation.id"
          :active="activeConversationId === conversation.id"
          rounded="lg"
          class="mb-2 inbox-page__conversation"
          @click="activeConversationId = conversation.id"
        >
          <template #prepend>
            <v-avatar :color="conversation.avatarColor" variant="tonal">
              {{ conversation.name.charAt(0) }}
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">{{ conversation.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ conversation.excerpt }}</v-list-item-subtitle>

          <template #append>
            <div class="d-flex flex-column align-end ga-1">
              <span class="text-caption text-medium-emphasis">{{ conversation.lastMessageAt }}</span>
              <v-badge
                v-if="conversation.unread"
                :content="conversation.unread"
                color="primary"
                inline
              />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </template>

    <UiListCard class="h-100 d-flex flex-column">
      <template v-if="activeConversation">
        <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
          <div>
            <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ activeConversation.name }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">Conversation active</p>
          </div>
          <v-btn variant="outlined" prepend-icon="mdi-account-plus-outline">Inviter</v-btn>
        </div>

        <div class="inbox-page__messages mb-4">
          <div
            v-for="message in messages"
            :key="message.id"
            class="inbox-page__bubble"
            :class="message.fromMe ? 'inbox-page__bubble--me' : 'inbox-page__bubble--other'"
          >
            <p class="text-caption text-medium-emphasis mb-1">{{ message.author }} • {{ message.time }}</p>
            <p class="text-body-2 mb-0">{{ message.content }}</p>
          </div>
        </div>

        <v-textarea
          label="Votre réponse"
          placeholder="Écrire un message..."
          rows="3"
          auto-grow
          variant="outlined"
          hide-details
          density="comfortable"
        />
        <div class="d-flex justify-end mt-3">
          <v-btn color="primary" prepend-icon="mdi-send">Envoyer</v-btn>
        </div>
      </template>

      <UiStateEmptyState
        v-else
        title="Aucune conversation sélectionnée"
        description="Choisissez une conversation à gauche pour afficher les messages."
        icon="mdi-email-open-outline"
      >
        <template #action>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus">Démarrer une discussion</v-btn>
        </template>
      </UiStateEmptyState>
    </UiListCard>
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
