<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStateLoadingState from '~/components/ui/state/UiLoadingState.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['profile.readOwn'],
})

const router = useRouter()
const { t } = useI18n()
const authSession = useAuthSessionStore()
const { canPermission } = useAccessControl()
const { isAuthenticated, fetchProfile, logout } = useAuth()

const loading = ref(false)
const errorMessage = ref('')

const profileDisplayName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return 'Guest User'
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})

const profileStatus = computed<'online' | 'offline'>(() => (isAuthenticated.value ? 'online' : 'offline'))

const emptyProfileDescription = computed(() => `${t('profile.tokenHint')} ${t('profile.tokenHeader')} ${t('profile.tokenHintSuffix')}`)

const loadProfile = async () => {
  if (!isAuthenticated.value) {
    errorMessage.value = t('errors.profile.noToken')
    return
  }

  if (!canPermission('profile.readOwn', { userId: authSession.profile?.id })) {
    errorMessage.value = t('profile.notAuthenticated')
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    await fetchProfile()
  }
  catch {
    errorMessage.value = t('errors.profile.loadFailed')
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isAuthenticated.value && !authSession.profile) {
    await loadProfile()
  }
})

const signOut = async () => {
  if (!canPermission('profile.logout')) {
    errorMessage.value = t('profile.notAuthenticated')
    return
  }

  await logout()
  await router.push('/login')
}
</script>

<template>
  <UiPageSection
    max-width="840"
  >
    <template #header>
      <UiSectionHeader :title="t('profile.title')">
        <template #actions>
          <v-btn
            v-if="canPermission('profile.logout')"
            variant="outlined"
            :disabled="!isAuthenticated"
            @click="signOut"
          >
            {{ t('profile.logout') }}
          </v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <div class="d-flex align-center ga-3 mb-4">
      <UiAvatar
        :src="authSession.profile?.photo"
        :name="profileDisplayName"
        size="lg"
        :status="profileStatus"
      />
      <div>
        <p class="text-subtitle-1 font-weight-bold mb-0">{{ profileDisplayName }}</p>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ t('profile.title') }}</p>
      </div>
    </div>

    <UiStateAlert
      v-if="!isAuthenticated"
      type="warning"
      variant="tonal"
      class="mb-4"
      :message="t('profile.notAuthenticated')"
    />

    <UiStateAlert
      v-else-if="loading"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <UiStateLoadingState
        :message="`${t('profile.load')}...`"
        mode="spinner"
      />
    </UiStateAlert>

    <UiStateAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      :message="errorMessage"
    />

    <UiCard
      v-if="authSession.profile"
      variant="tonal"
      rounded="lg"
      compact
    >
      <pre class="text-body-2">{{ authSession.profile }}</pre>
    </UiCard>

    <UiStateEmptyState
      v-else
      :title="t('profile.tokenHeader')"
      :description="emptyProfileDescription"
      icon="mdi-key-outline"
    />
  </UiPageSection>
</template>
