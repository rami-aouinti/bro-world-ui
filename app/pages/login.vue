<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()
const { t } = useI18n()
const authSession = useAuthSessionStore()
const { login, fetchProfile } = useAuth()

const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const resolveRedirectTarget = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (!redirect || redirect.startsWith('/login')) {
    return '/profile'
  }

  return redirect
}

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

    if (!authResponse.authenticated || !profile) {
      errorMessage.value = t('errors.auth.loginFailed')
      return
    }

    await navigateTo(resolveRedirectTarget(), { replace: true })
  }
  catch (error) {
    if (import.meta.dev) {
      console.error('Login failed', error)
    }

    errorMessage.value = t('errors.auth.loginFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UiPageSection
    max-width="520"
  >
    <template #header>
      <UiSectionHeader
        :title="t('login.title')"
        :subtitle="t('login.description')"
        dense
      />
    </template>
    <UiStateAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="comfortable"
      class="mb-4"
      :message="errorMessage"
    />

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
  </UiPageSection>
</template>
