<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import ProfileSidebarCard from '~/components/profile/ProfileSidebarCard.vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useFriendsStore } from '~/stores/friends'
import type { UserApplication, UserFriendRead, UserMeRead } from '~/types/api/user'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const currentUser = useCurrentUserStore()
const { t } = useI18n()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const friendsStore = useFriendsStore()

const profile = ref<UserMeRead | null>(null)
const latestApplications = ref<UserApplication[]>([])
const loadError = ref('')
const actionError = ref('')
const pendingActionKey = ref('')
const isLoading = ref(true)


const profileStats = computed(() => {
  const friendsCount = friendsStore.friends.length

  return [
    { label: t('profilePage.stats.friends'), value: friendsCount.toString(), icon: 'mdi-account-group-outline', color: 'primary' },
    { label: t('profilePage.stats.activeConnections'), value: (profile.value?.sessions?.length || 0).toString(), icon: 'mdi-laptop', color: 'success' },
    { label: t('profilePage.stats.linkedAccounts'), value: (profile.value?.socials?.length || 0).toString(), icon: 'mdi-link-variant', color: 'info' },
    { label: 'Community level', value: friendsCount > 15 ? 'Expert' : friendsCount > 7 ? 'Confirmed' : 'New', icon: 'mdi-star-circle-outline', color: 'warning' },
  ]
})

const fakeHighlights = [
  {
    title: t('profilePage.highlights.enrichedBio'),
    value: '92%',
    helper: 'Profile completion',
    icon: 'mdi-account-check-outline',
    color: 'success',
  },
  {
    title: 'Response rate',
    value: '87%',
    helper: 'Over the last 30 days',
    icon: 'mdi-message-reply-text-outline',
    color: 'primary',
  },
  {
    title: 'Availability',
    value: 'High',
    helper: 'Shared time slots',
    icon: 'mdi-clock-outline',
    color: 'info',
  },
]

const fakeActivityTimeline = [
  {
    date: 'Today • 09:45',
    title: 'Personal information updated',
    detail: 'Added a detailed bio, location, and phone number.',
    icon: 'mdi-account-edit-outline',
    color: 'primary',
  },
  {
    date: t('profilePage.timeline.yesterday'),
    title: t('profilePage.timeline.newDevice'),
    detail: 'Secure session with successful verification.',
    icon: 'mdi-shield-check-outline',
    color: 'success',
  },
  {
    date: t('profilePage.timeline.monday'),
    title: '2 new connections approved',
    detail: 'Your pending requests were accepted.',
    icon: 'mdi-account-multiple-check-outline',
    color: 'info',
  },
]

const latestApplicationsCount = computed(() => latestApplications.value.length)

const applicationStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'disabled':
      return 'error'
    default:
      return 'default'
  }
}

const friendDisplayName = (friend: UserFriendRead) => `${friend.firstName} ${friend.lastName}`.trim()

const loadData = async () => {
  loadError.value = ''
  isLoading.value = true
  try {
    profile.value = await currentUser.fetchMe(true)
    const [friendsResult, latestApplicationsResult] = await Promise.all([
      friendsStore.fetchAll(false),
      currentUser.fetchMyLatestApplications(),
    ])

    latestApplications.value = latestApplicationsResult
    await friendsResult
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'profilePage',
      action: 'loadSocial',
      fallbackKey: 'profilePage.errors.loadSocial',
    })
    $errorLogger(error, {
      area: 'profilePage',
      action: 'loadData',
      status: normalized.status,
    })
    loadError.value = normalized.message
  }
  finally {
    isLoading.value = false
  }
}

const runAction = async (actionKey: string, action: () => Promise<void>) => {
  actionError.value = ''
  pendingActionKey.value = actionKey

  try {
    await action()
  }
  catch (error) {
    const normalized = normalizeError(error, {
      fallbackKey: 'errors.actionUnavailable',
    })
    $errorLogger(error, {
      area: 'profilePage',
      action: actionKey,
      status: normalized.status,
    })
    actionError.value = normalized.message
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
      <v-card v-if="isLoading" class="pa-5" rounded="xl">
        <v-skeleton-loader type="avatar, heading, text@4" />
      </v-card>
      <ProfileSidebarCard v-else />
    </template>
    <template #aside>
      <v-card elevation="8" rounded="xl" v-if="friendsStore.friends.length">
          <h6 class="text-h6 font-weight-bold mb-2">Friends ({{ friendsStore.friends.length }})</h6>
          <v-list v-if="friendsStore.friends.length" class="pa-0 bg-transparent">
            <v-list-item v-for="friend in friendsStore.friends" :key="friend.id" class="px-0">
              <template #prepend>
                <v-avatar size="24" class="mr-1"><v-img :src="friend.photo || undefined" /></v-avatar>
              </template>
              <v-list-item-title>{{ friendDisplayName(friend) }}</v-list-item-title>
              <template #append>
                <div class="d-flex ga-2 px-1">
                  <v-btn icon="mdi-eye" size="small" variant="text" color="success" :to="`/user/${encodeURIComponent(friend.username)}/profile`"></v-btn>
                  <v-btn icon="mdi-account-minus"  size="small" color="warning" variant="text" :loading="pendingActionKey === `remove-${friend.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`remove-${friend.id}`, () => friendsStore.removeFriend(friend.id))"></v-btn>
                  <v-btn icon="mdi-account-off"  size="small" color="error" variant="text" :loading="pendingActionKey === `block-friend-${friend.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-friend-${friend.id}`, () => friendsStore.blockUser(friend.id))"></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">No friends.</p>
        </v-card>

      <v-card class="pa-1" elevation="2" rounded="xl">
          <h6 class="text-h6 font-weight-bold mb-2">Received requests ({{ friendsStore.incomingRequests.length }})</h6>
          <v-list v-if="friendsStore.incomingRequests.length" class="pa-0 bg-transparent">
            <v-list-item v-for="user in friendsStore.incomingRequests" :key="user.id" class="px-0">
              <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
              <template #append>
                <div class="d-flex ga-2">
                  <v-btn icon="mdi-account-check" size="small" color="success" variant="text" :loading="pendingActionKey === `accept-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`accept-${user.id}`, () => friendsStore.acceptRequest(user.id))"></v-btn>
                  <v-btn icon="mdi-account-minus" size="small" color="warning" variant="text" :loading="pendingActionKey === `reject-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`reject-${user.id}`, () => friendsStore.rejectRequest(user.id))"></v-btn>
                  <v-btn icon="mdi-account-off" size="small" color="error" variant="text" :loading="pendingActionKey === `block-incoming-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-incoming-${user.id}`, () => friendsStore.blockUser(user.id))"></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">No requests received.</p>
        </v-card>

      <v-card class="pa-1" elevation="2" rounded="xl">
          <h6 class="text-h6 font-weight-bold mb-2">Sent requests ({{ friendsStore.sentRequests.length }})</h6>
          <v-list v-if="friendsStore.sentRequests.length" class="pa-0 bg-transparent">
            <v-list-item v-for="user in friendsStore.sentRequests" :key="user.id" class="px-0">
              <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
              <template #append>
                <div class="d-flex ga-2">
                  <v-btn icon="mdi-account-alert" size="small" color="warning" variant="text" :loading="pendingActionKey === `cancel-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`cancel-${user.id}`, () => friendsStore.cancelSentRequest(user.id))"></v-btn>
                  <v-btn icon="mdi-account-off" size="small" color="error" variant="text" :loading="pendingActionKey === `block-sent-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`block-sent-${user.id}`, () => friendsStore.blockUser(user.id))"></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">No requests sent.</p>
        </v-card>

      <v-card class="pa-1" elevation="2" rounded="xl">
          <h6 class="text-h6 font-weight-bold mb-2">Blocked users ({{ friendsStore.blockedUsers.length }})</h6>
          <v-list v-if="friendsStore.blockedUsers.length" class="pa-0 bg-transparent">
            <v-list-item v-for="user in friendsStore.blockedUsers" :key="user.id" class="px-0">
              <v-list-item-title>{{ friendDisplayName(user) }}</v-list-item-title>
              <template #append>
                <v-btn icon="mdi-account-alert" size="small" color="warning" variant="text" :loading="pendingActionKey === `unblock-${user.id}`" :disabled="friendsStore.actionLoading" @click="runAction(`unblock-${user.id}`, () => friendsStore.unblockUser(user.id))"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">No blocked users.</p>
        </v-card>
    </template>

    <section>
      <template v-if="isLoading">
        <v-row>
          <v-col cols="12" sm="6" md="3" v-for="index in 4" :key="`stat-skeleton-${index}`">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-skeleton-loader type="list-item-three-line@6" />
      </template>

      <template v-else>
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }}</v-alert>
      <v-alert v-if="actionError" type="error" variant="tonal" class="mb-4">{{ actionError }}</v-alert>

      <v-row class="mb-1">
        <v-col v-for="item in profileStats" :key="item.label" cols="12" sm="6" md="6">
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
        <v-col cols="12">
          <v-card class="h-100 pa-3" variant="outlined" elevation="2" rounded="xl">
            <div class="d-flex align-center justify-space-between mb-2">
              <h6 class="text-h6 font-weight-bold mb-0">Latest applications ({{ latestApplicationsCount }})</h6>
              <v-btn size="small" variant="text" to="/profile/applications">See all</v-btn>
            </div>
            <v-list v-if="latestApplicationsCount" class="pa-0 bg-transparent">
              <v-list-item v-for="application in latestApplications" :key="application.id" class="px-0">
                <v-list-item-title>{{ application.title }}</v-list-item-title>
                <template #append>
                  <v-chip size="small" :color="applicationStatusColor(application.status)" variant="tonal">{{ application.status }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">No applications yet.</p>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="pa-5" elevation="2" rounded="xl">
            <h6 class="text-h6 font-weight-bold mb-4">{{ t('profilePage.timeline.recentActivity') }}</h6>
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
      </template>
    </section>
  </PlatformSplitLayout>
</template>
