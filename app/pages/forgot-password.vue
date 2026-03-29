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

useHead({
  title: 'Forgot Password',
})

const email = ref('')
const loading = ref(false)
const successMessage = ref('')

const submit = async () => {
  successMessage.value = ''
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 450))

  successMessage.value = 'If an account exists for this email, a reset link has been sent.'
  loading.value = false
}
</script>

<template>
  <div class="login-block">
    <v-card :loading="loading" class="login-card" max-width="520" min-width="400" elevation="10" rounded="xl">
      <div class="login-card__header">
        <div class="d-flex justify-center ga-2 mb-1">
          <NuxtLink to="/" class="text-decoration-none">
            <v-img src="/world-logo-primary.svg" alt="Bro World" width="72" height="72" class="d-inline-block" />
          </NuxtLink>
        </div>
      </div>

      <v-card-text class="login-card__body">
        <div class="login-divider mb-4">
          <v-divider class="flex-grow-1" />
          <span class="mx-4 text-medium-emphasis font-weight-bold">Forgot Password</span>
          <v-divider class="flex-grow-1" />
        </div>

        <UiStateAlert
          v-if="successMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
          :message="successMessage"
        />

        <v-form class="text-center" @submit.prevent="submit">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            rounded="xl"
            density="compact"
            required
            class="font-size-input input-style"
          />

          <v-btn
            type="submit"
            color="primary"
            class="font-weight-bold text-uppercase btn-default bg-gradient-primary login-submit"
            block
            :loading="loading"
          >
            Send
          </v-btn>

          <p class="text-sm mt-3 mb-3">
            Back to
            <NuxtLink to="/login" class="text-decoration-none font-weight-bolder">Sign in</NuxtLink>
          </p>
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
  min-height: 100vh;
  background: url('/background-world.png') center/cover no-repeat;
}

.login-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(var(--v-theme-primary), 0.05);
}

.login-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px !important;
  animation: login-card-enter 450ms ease-out;
}

.login-card__header {
  padding: 1rem 1rem 0.5rem;
}

.login-card__body {
  padding: 0.5rem;
}

.login-divider {
  display: flex;
  align-items: center;
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
