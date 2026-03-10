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
const { register } = useAuth()

const email = ref('')
const password = ref('')
const repeatPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const resolveRedirectTarget = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (!redirect || redirect.startsWith('/login') || redirect.startsWith('/register')) {
    return '/'
  }

  return redirect
}

const submit = async () => {
  errorMessage.value = ''

  if (password.value !== repeatPassword.value) {
    errorMessage.value = t('errors.auth.registerPasswordMismatch')
    return
  }

  loading.value = true

  try {
    const authResponse = await register(email.value, password.value, repeatPassword.value)

    if (!authResponse.authenticated || !authResponse.profile) {
      errorMessage.value = t('errors.auth.registerFailed')
      return
    }

    await navigateTo(resolveRedirectTarget(), { replace: true })
  }
  catch (error) {
    if (import.meta.dev) {
      console.error('Register failed', error)
    }

    errorMessage.value = t('errors.auth.registerFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UiPageShell
    :title="''"
    :subtitle="''"
    max-width="520"
    :loading="loading"
    skeleton="form"
    :empty="false"
  >
    <v-card class="login-card" elevation="10" rounded="xl">
      <div class="login-card__header">
        <h1 class="text-h4 font-weight-bold mb-6 text-center">{{ t('register.title') }}</h1>
      </div>

      <v-card-text class="login-card__body">
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
            v-model="email"
            :label="t('register.email')"
            type="email"
            required
            class="mb-3"
          />

          <v-text-field
            v-model="password"
            :label="t('register.password')"
            type="password"
            required
            class="mb-3"
          />

          <v-text-field
            v-model="repeatPassword"
            :label="t('register.repeatPassword')"
            type="password"
            required
            class="mb-6"
          />

          <v-btn
            type="submit"
            color="primary"
            class="login-submit"
            block
            :loading="loading"
          >
            {{ t('register.submit') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </UiPageShell>
</template>

<style scoped>
.login-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px !important;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22) !important;
  animation: login-card-enter 450ms ease-out;
}

.login-card__header {
  background: linear-gradient(135deg, #43a047, #66bb6a);
  color: white;
  padding: 2rem 1.5rem 1.25rem;
}

.login-card__body {
  padding: 1.5rem;
}

.login-submit {
  min-height: 50px;
  font-weight: 700;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.login-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.28);
}

@keyframes login-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
