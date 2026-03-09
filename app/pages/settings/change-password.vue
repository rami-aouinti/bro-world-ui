<script setup lang="ts">
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

const isLoading = ref(true)
const profile = ref<any>(null)
const email = ref<any>(null)
const username = ref<any>(null)
const firstName = ref<any>(null)
const lastName = ref<any>(null)
const gender = ref<any>(null)
const phone = ref<any>(null)
const location = ref<any>(null)
const birthday = ref<any>(null)
const profileDescription = ref<any>(null)


const loadProfile = async () => {
  profile.value = await currentUser.fetchMe();
  firstName.value = await currentUser.me?.firstName || '—';
  lastName.value = await currentUser.me?.lastName || '—';
  email.value = await currentUser.me?.email || '—';
  gender.value = await currentUser.me?.profile?.gender || '—';
  username.value = await currentUser.me?.username || '—';
  location.value = await currentUser.me?.profile?.location || '—';
  birthday.value = await currentUser.me?.profile?.birthday || '—';
  phone.value = await currentUser.me?.profile?.phone || '—';
  profileDescription.value = await currentUser.me?.profile?.information || 'No profile information yet.';
  isLoading.value = false;

}

onMounted(async () => {
  await loadProfile()

  await nextTick()
})
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
