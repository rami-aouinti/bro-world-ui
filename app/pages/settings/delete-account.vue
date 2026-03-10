<script setup lang="ts">
import { deletionConsequences } from '~/data/settings-demo'

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
    <v-card rounded="xl" border color="error" variant="tonal">
      <v-card-text>
        <h3 class="text-h5 font-weight-bold mb-2">Delete Account</h3>
        <p class="text-body-1 mb-4">This action is irreversible. Please review what happens next before confirming.</p>

        <v-list density="compact" class="mb-4 bg-transparent">
          <v-list-item v-for="item in deletionConsequences" :key="item" :title="item" prepend-icon="mdi-alert-circle-outline" />
        </v-list>

        <v-text-field v-model="confirmText" label="Type DELETE to confirm" variant="outlined" density="comfortable" class="mb-2" />
        <div class="d-flex justify-end">
          <v-btn color="error" :disabled="!canDelete" :loading="deleting" @click="onDelete">Delete account</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>
