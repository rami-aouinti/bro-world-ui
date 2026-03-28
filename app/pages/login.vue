<script setup lang="ts">
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
  public: true,
  requiresAuth: false,
  splitShell: false,
  skeleton: 'form',
})

const route = useRoute()
const { t } = useI18n()
const { login, fetchProfile } = useAuth()
const tracker = useTracker()

useHead({
  title: 'Login',
})

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
      tracker.track('auth.login.failed', {
        method: 'password',
        reason: 'missing-profile',
      })
      errorMessage.value = t('errors.auth.loginFailed')
      return
    }

    tracker.track('auth.login.succeeded', {
      method: 'password',
    })

    await navigateTo(resolveRedirectTarget(), { replace: true })
  }
  catch (error) {
    if (import.meta.dev) {
      console.error('Login failed', error)
    }

    tracker.trackError('auth.login.failed', error, {
      method: 'password',
    })

    errorMessage.value = t('errors.auth.loginFailed')
  }
  finally {
    loading.value = false
  }
}

const loginWithGithub = () => {
  const redirect = resolveRedirectTarget()
  const query = redirect && redirect !== '/'
    ? `?redirect=${encodeURIComponent(redirect)}`
    : ''

  window.location.href = `/api/auth/github${query}`
}
</script>

<template>
  <div class="login-block">
    <v-card :loading="loading" class="login-card" max-width="520" min-width="400" elevation="10" rounded="xl">
      <div class="login-card__header">
        <h1 class="text-h4 font-weight-bold mb-3 text-center">{{ t('app.name') }}</h1>

        <div class="d-flex justify-center ga-6 mb-3">
          <v-btn icon variant="text" color="white" aria-label="Login with Facebook" class="login-social-btn">
            <v-icon icon="mdi-facebook" size="28" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="white"
            aria-label="Login with Github"
            class="login-social-btn"
            @click="loginWithGithub"
          >
            <v-icon icon="mdi-github" size="28" />
          </v-btn>
          <v-btn icon variant="text" color="white" aria-label="Login with Google" class="login-social-btn">
            <v-icon icon="mdi-google" size="28" />
          </v-btn>
        </div>
      </div>

      <v-card-text class="login-card__body">
        <div class="login-divider mb-6">
          <v-divider class="flex-grow-1" />
          <span class="mx-4 text-medium-emphasis font-weight-bold">or</span>
          <v-divider class="flex-grow-1" />
        </div>

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
              class="login-submit"
              block
              :loading="loading"
          >
            {{ t('login.submit') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.login-block {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 500px;
  min-height: 100vh;
}
.login-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px !important;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22) !important;
  animation: login-card-enter 450ms ease-out;
}

.login-card__header {
  background: linear-gradient(135deg, rgba(var(--v-theme-on-surface), 0.98), rgba(var(--v-theme-on-surface), 0.08));
  padding: 2rem 1.5rem 1.25rem;
}

.login-card__body {
  padding: 1.5rem;
}

.login-divider {
  display: flex;
  align-items: center;
}

.login-social-btn {
  transition: transform 180ms ease, opacity 180ms ease;
}

.login-social-btn:hover {
  transform: translateY(-2px) scale(1.05);
  opacity: 0.95;
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
