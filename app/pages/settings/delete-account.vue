<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const { logout } = useAuth()
const router = useRouter()

const deleting = ref(false)
const confirmText = ref('')
const canDelete = computed(() => confirmText.value.trim().toUpperCase() === 'DELETE')

const onDelete = async () => {
  if (!canDelete.value) return

  deleting.value = true
  try {
    await currentUser.deleteAccount()
    await logout()
    await router.push('/login')
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <SettingsLayout>
    <div class="d-flex flex-wrap align-center ga-4 justify-space-between">
      <div>
        <h3 class="text-h5 font-weight-bold mb-2">Delete Account</h3>
        <p class="text-body-1 text-medium-emphasis mb-4">Once you delete your account, there is no going back.</p>
        <v-text-field v-model="confirmText" label="Type DELETE to confirm" variant="outlined" density="comfortable" />
      </div>

      <div class="d-flex ga-2">
        <v-btn color="error" :disabled="!canDelete" :loading="deleting" @click="onDelete">Delete account</v-btn>
      </div>
    </div>
  </SettingsLayout>
</template>
