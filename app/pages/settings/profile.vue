<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const { initSession } = useAuth()
const authSession = useAuthSessionStore()

await initSession()

const profile = computed(() => authSession.profile)
const fullName = computed(() => {
  if (!profile.value) return 'Guest User'
  return `${profile.value.firstName} ${profile.value.lastName}`.trim()
})
const headline = computed(() => {
  if (!profile.value) return 'Not connected'
  return profile.value.roles?.[0] ?? 'Member'
})
const bio = computed(() => {
  if (!profile.value) return 'Connectez-vous pour voir vos informations de profil.'

  return `Nom d'utilisateur: ${profile.value.username} · Fuseau horaire: ${profile.value.timezone}`
})
</script>

<template>
  <SettingsLayout>
    <div class="d-flex align-center ga-4">
      <UiAvatar
        :src="profile?.photo || '/images/placeholders/platform-media-fallback.svg'"
        :name="fullName"
        size="lg"
      />
      <div>
        <h2 class="text-h5 font-weight-bold mb-1">{{ fullName }}</h2>
        <p class="text-body-1 text-medium-emphasis mb-0">{{ headline }}</p>
      </div>
    </div>
    <h3 class="text-h6 font-weight-bold mb-4">Profile information</h3>
    <p class="text-body-1 text-medium-emphasis mb-0">
      {{ bio }}
    </p>
  </SettingsLayout>
</template>
