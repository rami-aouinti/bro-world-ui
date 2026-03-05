<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const { login } = useAuth()

const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    await login(usernameOrEmail.value, password.value)
    await router.push('/profile')
  }
  catch (error) {
    const fallbackMessage = 'Échec de connexion. Vérifiez vos identifiants.'
    errorMessage.value = error instanceof Error ? error.message : fallbackMessage
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-10" max-width="520">
    <v-card class="pa-6" rounded="xl" elevation="2">
      <h1 class="text-h5 font-weight-bold mb-2">Connexion</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Utilisez votre username ou email pour récupérer un token.
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
          label="Username ou email"
          placeholder="john-root"
          required
          class="mb-3"
        />

        <v-text-field
          v-model="password"
          label="Password"
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
          Se connecter
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>
