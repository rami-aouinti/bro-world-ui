<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const uploading = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)



const onUploadPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await currentUser.uploadPhoto(file)
  }
  finally {
    uploading.value = false
    input.value = ''
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
const fullName = ref<any>(null)
const headline = ref<any>(null)
const bio = ref<any>(null)


const loadProfile = async () => {
  fullName.value = currentUser.displayName
  headline.value = currentUser.me?.profile?.title || 'Member'
  bio.value = currentUser.me?.profile?.information || 'No bio yet.'
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
    <div class="d-flex align-center ga-4 mb-4">
      <UiAvatar :src="currentUser.me?.photo || '/images/placeholders/platform-media-fallback.svg'" :name="fullName" size="lg" />
      <div>
        <h2 class="text-h5 font-weight-bold mb-1">{{ fullName }}</h2>
        <p class="text-body-1 text-medium-emphasis mb-0">{{ headline }}</p>
      </div>
      <v-spacer />
      <v-btn :loading="uploading" variant="tonal" color="primary" @click="photoInput?.click()">Upload photo</v-btn>
      <input ref="photoInput" type="file" class="d-none" accept="image/*" @change="onUploadPhoto" />
    </div>

    <h3 class="text-h6 font-weight-bold mb-4">Profile information</h3>
    <p class="text-body-1 text-medium-emphasis mb-0">{{ bio }}</p>
  </SettingsLayout>
</template>
