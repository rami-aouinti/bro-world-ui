<script setup lang="ts">
import { deletionConsequences } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const { logout } = useAuth()
const router = useRouter()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const deleting = ref(false)
const errorMessage = ref('')
const confirmText = ref('')
const canDelete = computed(() => confirmText.value.trim().toUpperCase() === 'DELETE')

const onDelete = async () => {
  if (!canDelete.value) return

  deleting.value = true
  errorMessage.value = ''
  try {
    await currentUser.deleteAccount()
    await logout()
    await router.push('/login')
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'settings.deleteAccount',
      action: 'delete',
      fallbackKey: 'settings.deleteAccount.errors.delete',
    })
    $errorLogger(error, { area: 'settings.deleteAccount', action: 'delete', status: normalized.status })
    errorMessage.value = normalized.message
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <SettingsLayout>
    <v-card rounded="xl" border color="error" variant="tonal">
      <v-card-text>
        <h3 class="text-h5 font-weight-bold mb-2">Delete Account</h3>
        <p class="text-body-1 mb-4">This action is irreversible. Please review what happens next before confirming.</p>

        <v-list density="compact" class="mb-4 bg-transparent">
          <v-list-item v-for="item in deletionConsequences" :key="item" :title="item" prepend-icon="mdi-alert-circle-outline" />
        </v-list>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-3">{{ errorMessage }}</v-alert>
        <v-text-field v-model="confirmText" label="Type DELETE to confirm" variant="outlined" density="comfortable" class="mb-2" />
        <div class="d-flex justify-end">
          <v-btn color="error" :disabled="!canDelete" :loading="deleting" @click="onDelete">Delete account</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>
