<script setup lang="ts">
import UiPageShell from '~/components/ui/page/UiPageShell.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
  public: true,
  requiresAuth: false,
  splitShell: false,
  middleware: ['guest-only'],
  skeleton: 'form',
})

const route = useRoute()
const { t } = useI18n()
const { login, fetchProfile } = useAuth()

const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')


const resolveRedirectTarget = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (!redirect || redirect.startsWith('/login')) {
    return '/'
  }

  return redirect
}

const submit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const authResponse = await login(usernameOrEmail.value, password.value)
    const profile = authResponse.profile ?? await fetchProfile()

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
  <UiPageShell
    :title="t('login.title')"
    :subtitle="t('login.description')"
    max-width="520"
    :loading="loading"
    skeleton="form"
    :empty="false"
  >
    <UiStateAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
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
  </UiPageShell>
</template>
