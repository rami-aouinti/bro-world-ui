<script setup lang="ts">
import { passwordPolicyChecks } from '~/data/settings-demo'
import { validateChangePasswordForm } from '~/validation/schemas'

const { t } = useI18n()

definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const loading = ref(false)
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const errorMessage = ref('')
const successMessage = ref('')
const validation = ref(validateChangePasswordForm(form, (key) => key))

const runValidation = () => {
  validation.value = validateChangePasswordForm(form, t)
  return validation.value.isValid
}

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!runValidation()) {
    errorMessage.value = validation.value.summary[0] ?? ''
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
    const apiMessage = typeof error === 'object'
      && error !== null
      && 'data' in error
      && typeof error.data === 'object'
      && error.data !== null
      && 'message' in error.data
      && typeof error.data.message === 'string'
      ? error.data.message
      : null

    errorMessage.value = apiMessage || 'Unable to update password.'
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
              <v-text-field v-model="form.currentPassword" label="Current password" type="password" variant="outlined" class="mb-3" :error="Boolean(validation.fieldErrors.currentPassword?.length)" :error-messages="validation.fieldErrors.currentPassword" />
              <v-text-field v-model="form.newPassword" label="New password" type="password" variant="outlined" class="mb-3" :error="Boolean(validation.fieldErrors.newPassword?.length)" :error-messages="validation.fieldErrors.newPassword" />
              <v-text-field v-model="form.confirmPassword" label="Confirm new password" type="password" variant="outlined" class="mb-3" :error="Boolean(validation.fieldErrors.confirmPassword?.length)" :error-messages="validation.fieldErrors.confirmPassword" />
              <v-alert v-if="validation.summary.length" type="error" variant="tonal" class="mb-3" role="alert">
                <p class="font-weight-bold mb-1">Validation errors</p>
                <ul class="pl-4 mb-0">
                  <li v-for="message in validation.summary" :key="message">{{ message }}</li>
                </ul>
              </v-alert>
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
