<script setup lang="ts">
import { onMounted, ref } from 'vue'

const router = useRouter()
const { t } = useI18n()
const authSession = useAuthSessionStore()
const { isAuthenticated, fetchProfile, logout } = useAuth()

const loading = ref(false)
const errorMessage = ref('')

const loadProfile = async () => {
  if (!isAuthenticated.value) {
    errorMessage.value = t('errors.profile.noToken')
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const profile = await fetchProfile()

    if (profile) {
      authSession.setProfile(profile)
    }
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
  await logout()
  await router.push('/login')
}
</script>

<template>
  <v-container class="py-10" max-width="840">
    <v-card class="pa-6" rounded="xl" elevation="2">
      <div class="d-flex align-center justify-space-between ga-3 mb-4 flex-wrap">
        <h1 class="text-h5 font-weight-bold">{{ t('profile.title') }}</h1>

        <div class="d-flex ga-2">
          <v-btn
            variant="outlined"
            :disabled="!isAuthenticated"
            @click="signOut"
          >
            {{ t('profile.logout') }}
          </v-btn>
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

      <v-card
        v-if="authSession.profile"
        variant="tonal"
        rounded="lg"
        class="pa-4"
      >
        <pre class="text-body-2">{{ authSession.profile }}</pre>
      </v-card>

      <p
        v-else
        class="text-body-2 text-medium-emphasis"
      >
        <span v-html="t('profile.tokenHint')" />
      </p>
    </v-card>
  </v-container>
</template>
