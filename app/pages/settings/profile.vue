<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const currentUser = useCurrentUserStore()
const uploading = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)

await currentUser.fetchMe()

const fullName = computed(() => currentUser.displayName)
const headline = computed(() => currentUser.me?.profile?.title || 'Member')
const bio = computed(() => currentUser.me?.profile?.information || 'No bio yet.')

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
