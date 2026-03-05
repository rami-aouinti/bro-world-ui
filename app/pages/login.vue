<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const { t } = useI18n()
const authSession = useAuthSessionStore()
const { login, fetchProfile } = useAuth()

const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const authResponse = await login(usernameOrEmail.value, password.value)
    const profile = authResponse.profile ?? await fetchProfile()

    authSession.setSession({
      token: authResponse.authenticated ? '__server_session__' : null,
      profile,
    })

    if (authResponse.authenticated && profile) {
      await router.push('/profile')
      return
    }

    throw new Error('Incomplete session state')
  }
  catch {
    errorMessage.value = t('errors.auth.loginFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-10" max-width="520">
    <v-card class="pa-6" rounded="xl" elevation="2">
      <h1 class="text-h5 font-weight-bold mb-2">{{ t('login.title') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        {{ t('login.description') }}
      </p>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="comfortable"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="usernameOrEmail"
          :label="t('login.usernameOrEmail')"
          :placeholder="t('login.usernameOrEmailPlaceholder')"
          required
          class="mb-3"
        />

        <v-text-field
          v-model="password"
          :label="t('login.password')"
          type="password"
          required
          class="mb-6"
        />

        <v-btn
          type="submit"
          color="primary"
          block
          :loading="loading"
        >
          {{ t('login.submit') }}
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>
