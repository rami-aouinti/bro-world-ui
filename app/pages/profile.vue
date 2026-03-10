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

const fullName = computed(() => currentUser.displayName)
const email = computed(() => currentUser.me?.email || '—')
const username = computed(() => currentUser.me?.username || '—')
const locationLabel = computed(() => currentUser.me?.profile?.location || '—')
const phone = computed(() => currentUser.me?.profile?.phone || '—')
const profileDescription = computed(() => currentUser.me?.profile?.information || 'No profile information yet.')

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

const runAction = async (action: () => Promise<void>) => {
  actionError.value = ''
  try {
    await action()
  }
  catch (error) {
    console.error(error)
    actionError.value = 'Action impossible pour le moment.'
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
      <h6 class="mb-4 text-h6 font-weight-bold">Profile Information</h6>
      <p class="text-body-1 mb-4 text-medium-emphasis">{{ profileDescription }}</p>
      <v-divider class="mb-4" />
      <v-list class="pa-0 bg-transparent">
        <v-list-item class="px-0"><strong>Full Name:</strong>&nbsp; {{ fullName }}</v-list-item>
        <v-list-item class="px-0"><strong>Username:</strong>&nbsp; {{ username }}</v-list-item>
        <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
        <v-list-item class="px-0"><strong>Phone:</strong>&nbsp; {{ phone }}</v-list-item>
        <v-list-item class="px-0"><strong>Location:</strong>&nbsp; {{ locationLabel }}</v-list-item>
      </v-list>
    </template>

    <section>
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }}</v-alert>
      <v-alert v-if="actionError" type="error" variant="tonal" class="mb-4">{{ actionError }}</v-alert>

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
                    <v-btn size="small" color="warning" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.removeFriend(friend.id))">Retirer</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.blockUser(friend.id))">Bloquer</v-btn>
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
                    <v-btn size="small" color="success" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.acceptRequest(user.id))">Accepter</v-btn>
                    <v-btn size="small" color="warning" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.rejectRequest(user.id))">Refuser</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.blockUser(user.id))">Bloquer</v-btn>
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
                    <v-btn size="small" color="warning" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.cancelSentRequest(user.id))">Annuler</v-btn>
                    <v-btn size="small" color="error" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.blockUser(user.id))">Bloquer</v-btn>
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
                  <v-btn size="small" color="warning" variant="tonal" :loading="friendsStore.actionLoading" @click="runAction(() => friendsStore.unblockUser(user.id))">Débloquer</v-btn>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucun utilisateur bloqué.</p>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
