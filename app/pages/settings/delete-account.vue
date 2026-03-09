<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const { logout } = useAuth()
const deleting = ref(false)
const confirmText = ref('')
const router = useRouter()

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
