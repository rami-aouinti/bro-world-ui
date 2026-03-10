<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useFriendsStore } from '~/stores/friends'
import type { UserFriendRead } from '~/types/api/user'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const currentUser = useCurrentUserStore()
const friendsStore = useFriendsStore()

const profile = ref<any>(null)
const loadError = ref('')
const actionError = ref('')
const pendingActionKey = ref('')

const fullName = computed(() => currentUser.displayName)
const email = computed(() => currentUser.me?.email || '—')
const username = computed(() => currentUser.me?.username || '—')
const locationLabel = computed(() => currentUser.me?.profile?.location || '—')
const phone = computed(() => currentUser.me?.profile?.phone || '—')
const profileDescription = computed(() => currentUser.me?.profile?.information || 'No profile information yet.')
const memberSince = computed(() => {
  const date = currentUser.me?.createdAt
  if (!date)
    return 'Janvier 2024'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime()))
    return 'Janvier 2024'

  return parsedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const profileStats = computed(() => {
  const friendsCount = friendsStore.friends.length

  return [
    { label: 'Amis', value: friendsCount.toString(), icon: 'mdi-account-group-outline', color: 'primary' },
    { label: 'Connexions actives', value: (profile.value?.sessions?.length || 0).toString(), icon: 'mdi-laptop', color: 'success' },
    { label: 'Comptes liés', value: (profile.value?.socials?.length || 0).toString(), icon: 'mdi-link-variant', color: 'info' },
    { label: 'Niveau communauté', value: friendsCount > 15 ? 'Expert' : friendsCount > 7 ? 'Confirmé' : 'Nouveau', icon: 'mdi-star-circle-outline', color: 'warning' },
  ]
})

const fakeHighlights = [
  {
    title: 'Bio enrichie',
    value: '92%',
    helper: 'Complétion du profil',
    icon: 'mdi-account-check-outline',
    color: 'success',
  },
  {
    title: 'Taux de réponse',
    value: '87%',
    helper: 'Sur les 30 derniers jours',
    icon: 'mdi-message-reply-text-outline',
    color: 'primary',
  },
  {
    title: 'Disponibilité',
    value: 'Élevée',
    helper: 'Plages horaires partagées',
    icon: 'mdi-clock-outline',
    color: 'info',
  },
]

const fakeActivityTimeline = [
  {
    date: 'Aujourd’hui • 09:45',
    title: 'Mise à jour des informations personnelles',
    detail: 'Ajout d’une bio détaillée, localisation et numéro de téléphone.',
    icon: 'mdi-account-edit-outline',
    color: 'primary',
  },
  {
    date: 'Hier • 18:20',
    title: 'Connexion depuis un nouvel appareil',
    detail: 'Session sécurisée avec validation réussie.',
    icon: 'mdi-shield-check-outline',
    color: 'success',
  },
  {
    date: 'Lundi • 12:10',
    title: '2 nouvelles relations validées',
    detail: 'Vos demandes en attente ont été acceptées.',
    icon: 'mdi-account-multiple-check-outline',
    color: 'info',
  },
]

const fakeBadges = [
  { label: 'Ambassadeur', color: 'deep-purple' },
  { label: 'Mentor actif', color: 'teal' },
  { label: 'Profil vérifié', color: 'indigo' },
]

const friendDisplayName = (friend: UserFriendRead) => `${friend.firstName} ${friend.lastName}`.trim()

const loadData = async () => {
  loadError.value = ''
  try {
    profile.value = await currentUser.fetchMe(true)
    await friendsStore.fetchAll(true)
  }
  catch (error) {
    console.error(error)
    loadError.value = 'Impossible de charger les relations sociales.'
  }
}

const runAction = async (actionKey: string, action: () => Promise<void>) => {
  actionError.value = ''
  pendingActionKey.value = actionKey

  try {
    await action()
  }
  catch (error) {
    console.error(error)
    actionError.value = 'Action impossible pour le moment.'
  }
  finally {
    pendingActionKey.value = ''
  }
}

onMounted(async () => {
  await loadData()
  await nextTick()
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <v-card class="pa-5 profile-sidebar-card" elevation="2" rounded="xl">
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar size="56" color="primary" variant="tonal">
            <v-icon icon="mdi-account-circle-outline" size="32" />
          </v-avatar>
          <div>
            <h6 class="text-h6 font-weight-bold mb-1">{{ fullName }}</h6>
            <p class="mb-0 text-body-2 text-medium-emphasis">@{{ username }} • Membre depuis {{ memberSince }}</p>
          </div>
        </div>

        <p class="text-body-1 mb-4 text-medium-emphasis">{{ profileDescription }}</p>

        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip v-for="badge in fakeBadges" :key="badge.label" size="small" :color="badge.color" variant="tonal">
            {{ badge.label }}
          </v-chip>
        </div>

        <v-divider class="mb-4" />
        <v-list class="pa-0 bg-transparent">
          <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
          <v-list-item class="px-0"><strong>Téléphone:</strong>&nbsp; {{ phone }}</v-list-item>
          <v-list-item class="px-0"><strong>Localisation:</strong>&nbsp; {{ locationLabel }}</v-list-item>
        </v-list>
      </v-card>
    </template>

    <section>
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }}</v-alert>
      <v-alert v-if="actionError" type="error" variant="tonal" class="mb-4">{{ actionError }}</v-alert>

      <v-row class="mb-1">
        <v-col v-for="item in profileStats" :key="item.label" cols="12" sm="6" md="3">
          <v-card class="pa-4 h-100" elevation="1" rounded="xl">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-medium-emphasis">{{ item.label }}</span>
              <v-avatar size="28" :color="item.color" variant="tonal">
                <v-icon :icon="item.icon" size="16" />
              </v-avatar>
            </div>
            <p class="text-h5 font-weight-bold mb-0">{{ item.value }}</p>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="highlight in fakeHighlights" :key="highlight.title" cols="12" md="4">
          <v-card class="pa-4 h-100" rounded="xl" variant="outlined">
            <div class="d-flex align-center ga-3">
              <v-avatar size="40" :color="highlight.color" variant="tonal">
                <v-icon :icon="highlight.icon" />
              </v-avatar>
              <div>
                <p class="mb-0 text-subtitle-2">{{ highlight.title }}</p>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ highlight.helper }}</p>
              </div>
            </div>
            <p class="text-h5 font-weight-bold mt-4 mb-0">{{ highlight.value }}</p>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Social Accounts</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item v-for="social in profile?.socials || []" :key="`${social?.provider}-${social?.providerId}`" class="px-0">
                <v-list-item-title class="text-capitalize">{{ social?.provider }}</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-medium-emphasis">{{ social?.providerId }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Sessions</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item v-for="(session, index) in profile?.sessions || []" :key="session?.id || index" class="px-0 mb-2">
                <v-list-item-title>{{ session?.userAgent || 'Unknown device' }}</v-list-item-title>
                <v-list-item-subtitle>{{ session?.ip || 'Unknown IP' }}</v-list-item-subtitle>
                <template #append>
                  <v-chip v-if="session?.current" size="small" color="success" variant="tonal">Current</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">Amis ({{ friendsStore.friends.length }})</h6>
            <v-list v-if="friendsStore.friends.length" class="pa-0 bg-transparent">
              <v-list-item v-for="friend in friendsStore.friends" :key="friend.id" class="px-0">
                <template #prepend>
                  <v-avatar size="36" class="mr-2"><v-img :src="friend.photo || undefined" /></v-avatar>
                </template>
                <v-list-item-title>{{ friendDisplayName(friend) }}</v-list-item-title>
                <v-list-item-subtitle>@{{ friend.username }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex ga-2">
                    <v-btn size="small" variant="text" :to="`/user/${encodeURIComponent(friend.username)}/profile`">Voir</v-btn>
                    <v-btn size="small" color="warning" variant="tonal" :loading="pendingActionKey === `remove-${friend.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`remove-${friend.id}`, () => friendsStore.removeFriend(friend.id))">Retirer</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="pendingActionKey === `block-friend-${friend.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-friend-${friend.id}`, () => friendsStore.blockUser(friend.id))">Bloquer</v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucun ami.</p>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">Demandes reçues ({{ friendsStore.incomingRequests.length }})</h6>
            <v-list v-if="friendsStore.incomingRequests.length" class="pa-0 bg-transparent">
              <v-list-item v-for="user in friendsStore.incomingRequests" :key="user.id" class="px-0">
                <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
                <v-list-item-subtitle>@{{ user.username }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex ga-2">
                    <v-btn size="small" color="success" variant="tonal" :loading="pendingActionKey === `accept-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`accept-${user.id}`, () => friendsStore.acceptRequest(user.id))">Accepter</v-btn>
                    <v-btn size="small" color="warning" variant="tonal" :loading="pendingActionKey === `reject-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`reject-${user.id}`, () => friendsStore.rejectRequest(user.id))">Refuser</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="pendingActionKey === `block-incoming-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-incoming-${user.id}`, () => friendsStore.blockUser(user.id))">Bloquer</v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucune demande reçue.</p>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">Demandes envoyées ({{ friendsStore.sentRequests.length }})</h6>
            <v-list v-if="friendsStore.sentRequests.length" class="pa-0 bg-transparent">
              <v-list-item v-for="user in friendsStore.sentRequests" :key="user.id" class="px-0">
                <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
                <v-list-item-subtitle>@{{ user.username }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex ga-2">
                    <v-btn size="small" color="warning" variant="tonal" :loading="pendingActionKey === `cancel-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`cancel-${user.id}`, () => friendsStore.cancelSentRequest(user.id))">Annuler</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="pendingActionKey === `block-sent-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-sent-${user.id}`, () => friendsStore.blockUser(user.id))">Bloquer</v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucune demande envoyée.</p>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">Utilisateurs bloqués ({{ friendsStore.blockedUsers.length }})</h6>
            <v-list v-if="friendsStore.blockedUsers.length" class="pa-0 bg-transparent">
              <v-list-item v-for="user in friendsStore.blockedUsers" :key="user.id" class="px-0">
                <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
                <v-list-item-subtitle>@{{ user.username }}</v-list-item-subtitle>
                <template #append>
                  <v-btn size="small" color="warning" variant="tonal" :loading="pendingActionKey === `unblock-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`unblock-${user.id}`, () => friendsStore.unblockUser(user.id))">Débloquer</v-btn>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucun utilisateur bloqué.</p>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">Activité récente (données de démonstration)</h6>
            <v-timeline density="compact" side="end" class="pa-0">
              <v-timeline-item
                v-for="event in fakeActivityTimeline"
                :key="event.title"
                :dot-color="event.color"
                size="small"
              >
                <div class="d-flex flex-column">
                  <span class="text-caption text-medium-emphasis">{{ event.date }}</span>
                  <span class="text-subtitle-2 font-weight-medium">{{ event.title }}</span>
                  <span class="text-body-2 text-medium-emphasis">{{ event.detail }}</span>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.profile-sidebar-card {
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
}
</style>
