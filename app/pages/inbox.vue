<script setup lang="ts">
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
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
  <UiPageSection max-width="1250">
    <v-card class="pa-6 pa-md-8 mb-6 rounded-xl elevation-2">
      <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
        <div>
          <p class="text-overline text-primary mb-2">Messagerie</p>
          <h1 class="text-h4 font-weight-bold mb-2 d-flex align-center ga-2">
            <v-icon icon="mdi-email-fast-outline" color="primary" />
            Inbox
          </h1>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Centralisez vos conversations d'équipe et répondez rapidement aux messages importants.
          </p>
        </div>

        <v-btn color="primary" prepend-icon="mdi-pencil-outline">Nouveau message</v-btn>
      </div>
    </v-card>

    <v-row>
      <v-col cols="12" lg="4">
        <v-card class="pa-4 rounded-xl elevation-1 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Conversations</h2>
            <v-chip size="small" variant="tonal">{{ conversations.length }}</v-chip>
          </div>

          <v-list class="bg-transparent pa-0" nav>
            <v-list-item
              v-for="conversation in conversations"
              :key="conversation.id"
              :active="activeConversationId === conversation.id"
              rounded="lg"
              class="mb-2"
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
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="pa-4 pa-md-5 rounded-xl elevation-1 h-100 d-flex flex-column">
          <template v-if="activeConversation">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h2 class="text-h6 mb-1">{{ activeConversation.name }}</h2>
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
        </v-card>
      </v-col>
    </v-row>
  </UiPageSection>
</template>

<style scoped>
.inbox-page__messages {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inbox-page__bubble {
  border-radius: 14px;
  padding: 0.75rem 1rem;
  max-width: 90%;
}

.inbox-page__bubble--other {
  background: rgba(var(--v-theme-primary), 0.08);
}

.inbox-page__bubble--me {
  background: rgba(var(--v-theme-surface-variant), 0.65);
  margin-left: auto;
}
</style>
