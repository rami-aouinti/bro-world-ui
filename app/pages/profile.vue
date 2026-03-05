<script setup lang="ts">
import { ref } from 'vue'

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  language: string
  locale: string
  timezone: string
  roles: string[]
}

const router = useRouter()
const { t } = useI18n()
const { token, isAuthenticated, logout } = useAuth()
const { apiFetch } = useApiClient()

const profile = ref<UserProfile | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const loadProfile = async () => {
  if (!token.value) {
    errorMessage.value = t('errors.profile.noToken')
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    profile.value = await apiFetch<UserProfile>('/api/v1/profile', {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
  }
  catch {
    errorMessage.value = t('errors.profile.loadFailed')
  }
  finally {
    loading.value = false
  }
}

const signOut = async () => {
  logout()
  profile.value = null
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
            color="primary"
            :loading="loading"
            :disabled="!isAuthenticated"
            @click="loadProfile"
          >
            {{ t('profile.load') }}
          </v-btn>

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
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-card
        v-if="profile"
        variant="tonal"
        rounded="lg"
        class="pa-4"
      >
        <pre class="text-body-2">{{ profile }}</pre>
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
