<script setup lang="ts">
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
    :title="t('profile.title')"
  >
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

    <div class="d-flex align-center ga-3 mb-4">
      <UiAvatar
        :name="profileDisplayName"
        size="lg"
        :status="profileStatus"
      />
      <div>
        <p class="text-subtitle-1 font-weight-bold mb-0">{{ profileDisplayName }}</p>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ t('profile.title') }}</p>
      </div>
    </div>

    <v-alert
      v-if="!isAuthenticated"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      {{ t('profile.notAuthenticated') }}
    </v-alert>

    <v-alert
      v-else-if="loading"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      {{ t('profile.load') }}...
    </v-alert>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <UiCard
      v-if="authSession.profile"
      variant="tonal"
      rounded="lg"
      compact
    >
      <pre class="text-body-2">{{ authSession.profile }}</pre>
    </UiCard>

    <p
      v-else
      class="text-body-2 text-medium-emphasis"
    >
      {{ t('profile.tokenHint') }}
      <code>{{ t('profile.tokenHeader') }}</code>
      {{ t('profile.tokenHintSuffix') }}
    </p>
  </UiPageSection>
</template>
