<script setup lang="ts">
import { passwordPolicyChecks } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const loading = ref(false)
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const errorMessage = ref('')
const successMessage = ref('')

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await currentUser.updatePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    successMessage.value = 'Password updated successfully.'
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  }
  catch (error: unknown) {
    const normalized = normalizeError(error, {
      domain: 'settings.changePassword',
      action: 'update',
      fallbackKey: 'settings.changePassword.errors.update',
    })
    $errorLogger(error, { area: 'settings.changePassword', action: 'update', status: normalized.status })
    errorMessage.value = normalized.message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <SettingsLayout>
    <v-card rounded="xl" variant="outlined" class="mb-4">
      <v-card-text>
        <h3 class="text-h5 font-weight-bold mb-1">Change Password</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Use a strong and unique password to keep your account secure.</p>

        <v-row>
          <v-col cols="12" md="7">
            <v-form @submit.prevent="onSubmit">
              <v-text-field v-model="form.currentPassword" label="Current password" type="password" variant="outlined" class="mb-3" />
              <v-text-field v-model="form.newPassword" label="New password" type="password" variant="outlined" class="mb-3" />
              <v-text-field v-model="form.confirmPassword" label="Confirm new password" type="password" variant="outlined" class="mb-3" />
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-3">{{ errorMessage }}</v-alert>
              <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-3">{{ successMessage }}</v-alert>
              <div class="d-flex justify-end">
                <v-btn color="primary" type="submit" :loading="loading">Update password</v-btn>
              </div>
            </v-form>
          </v-col>

          <v-col cols="12" md="5">
            <v-sheet rounded="lg" color="surface-variant" class="pa-4">
              <p class="text-subtitle-2 mb-2">Password policy</p>
              <v-list density="compact" class="py-0 bg-transparent">
                <v-list-item
                  v-for="rule in passwordPolicyChecks"
                  :key="rule.text"
                  :title="rule.text"
                  :prepend-icon="rule.valid ? 'mdi-check-circle' : 'mdi-alert-circle-outline'"
                >
                  <template #append>
                    <v-chip size="x-small" :color="rule.valid ? 'success' : 'warning'" variant="tonal">{{ rule.valid ? 'OK' : 'Missing' }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>
