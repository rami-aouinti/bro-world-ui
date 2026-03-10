<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useFriendsStore } from '~/stores/friends'
import { useCurrentUserStore } from '~/stores/currentUser'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()
const { isAuthenticated } = useAuth()
const currentUser = useCurrentUserStore()
const friendsStore = useFriendsStore()

const username = computed(() => String(route.params.username ?? ''))
const actionError = ref('')
const targetUserId = ref<string | null>(null)

const displayName = computed(() => username.value || 'Unknown user')
const isMe = computed(() => currentUser.me?.username === username.value)
const relation = computed(() => friendsStore.relationForUsername(username.value))

const relationActions = computed(() => {
  if (!isAuthenticated.value || isMe.value || !username.value || !targetUserId.value) return [] as Array<{ key: string, label: string, color: string, variant?: 'flat' | 'tonal', run: () => Promise<void> }>

  if (relation.value === 'blocked') {
    return [{ key: 'unblock', label: 'Débloquer', color: 'warning', variant: 'tonal', run: () => friendsStore.unblockUser(targetUserId.value!) }]
  }

  if (relation.value === 'friend') {
    return [
      { key: 'remove-friend', label: 'Retirer des amis', color: 'warning', variant: 'tonal', run: () => friendsStore.removeFriend(targetUserId.value!) },
      { key: 'block', label: 'Bloquer', color: 'error', variant: 'tonal', run: () => friendsStore.blockUser(targetUserId.value!) },
    ]
  }

  if (relation.value === 'sent_request') {
    return [
      { key: 'cancel-request', label: 'Annuler la demande', color: 'warning', variant: 'tonal', run: () => friendsStore.cancelSentRequest(targetUserId.value!) },
      { key: 'block', label: 'Bloquer', color: 'error', variant: 'tonal', run: () => friendsStore.blockUser(targetUserId.value!) },
    ]
  }

  if (relation.value === 'incoming_request') {
    return [
      { key: 'accept-request', label: 'Accepter', color: 'success', variant: 'tonal', run: () => friendsStore.acceptRequest(targetUserId.value!) },
      { key: 'reject-request', label: 'Refuser', color: 'warning', variant: 'tonal', run: () => friendsStore.rejectRequest(targetUserId.value!) },
      { key: 'block', label: 'Bloquer', color: 'error', variant: 'tonal', run: () => friendsStore.blockUser(targetUserId.value!) },
    ]
  }

  return [
    { key: 'add-friend', label: 'Ajouter en ami', color: 'primary', variant: 'flat', run: () => friendsStore.sendRequest(targetUserId.value!) },
    { key: 'block', label: 'Bloquer', color: 'error', variant: 'tonal', run: () => friendsStore.blockUser(targetUserId.value!) },
  ]
})

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

watch(() => route.params.username, async () => {
  targetUserId.value = null

  if (!isAuthenticated.value) {
    return
  }

  await currentUser.fetchMe()
  await friendsStore.fetchAll(true)

  const knownUserId = friendsStore.findUserIdByUsername(username.value)
  if (knownUserId) {
    targetUserId.value = knownUserId
    return
  }

  const targetUser = await useUsersApi().getByUsername(username.value)
  targetUserId.value = targetUser?.id ?? null
}, { immediate: true })
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="User Profile"
        :subtitle="`Profil public de @${username}`"
      />

      <div class="d-flex align-center ga-3 mb-4">
        <UiAvatar :name="displayName" size="lg" />
        <div>
          <p class="text-h6 mb-0">@{{ username }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">Public profile page</p>
        </div>
      </div>
    </template>

    <div class="d-flex ga-3 flex-wrap">
      <v-btn variant="outlined" to="/platform">Voir les platforms</v-btn>
      <v-btn color="primary" variant="flat" to="/profile">Mon profil</v-btn>

      <template v-if="isAuthenticated && !isMe">
        <v-btn
          v-for="action in relationActions"
          :key="action.key"
          :color="action.color"
          :variant="action.variant ?? 'tonal'"
          :loading="friendsStore.actionLoading"
          @click="runAction(action.run)"
        >
          {{ action.label }}
        </v-btn>
      </template>
    </div>

    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-4">{{ actionError }}</v-alert>
  </PlatformSplitLayout>
</template>
