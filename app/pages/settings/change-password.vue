<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const currentUser = useCurrentUserStore()
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
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Unable to update password.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-6">Change Password</h3>
    <v-form @submit.prevent="onSubmit">
      <v-text-field v-model="form.currentPassword" label="Current password" type="password" variant="outlined" class="mb-4" />
      <v-text-field v-model="form.newPassword" label="New password" type="password" variant="outlined" class="mb-4" />
      <v-text-field v-model="form.confirmPassword" label="Confirm new password" type="password" variant="outlined" class="mb-4" />
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</v-alert>

      <div class="d-flex justify-end">
        <v-btn color="primary" type="submit" :loading="loading">Update password</v-btn>
      </div>
    </v-form>
  </SettingsLayout>
</template>
