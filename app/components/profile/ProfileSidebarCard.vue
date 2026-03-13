<script setup lang="ts">
import { useCurrentUserStore } from '~/stores/currentUser'

const currentUser = useCurrentUserStore()

const fullName = computed(() => currentUser.displayName)
const email = computed(() => currentUser.me?.email || '—')
const username = computed(() => currentUser.me?.username || '—')
const locationLabel = computed(() => currentUser.me?.profile?.location || '—')
const phone = computed(() => currentUser.me?.profile?.phone || '—')
const profileDescription = computed(() => currentUser.me?.profile?.information || 'No profile information yet.')

const memberSince = computed(() => {
  const date = currentUser.me?.createdAt
  if (!date)
    return 'Janvier 2024'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime()))
    return 'Janvier 2024'

  return parsedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const fakeBadges = [
  { label: 'Ambassadeur', color: 'deep-purple' },
  { label: 'Mentor actif', color: 'teal' },
  { label: 'Profil vérifié', color: 'indigo' },
]
</script>

<template>
  <div class="d-flex align-center ga-3 mb-2">
    <v-avatar size="56" color="primary" variant="tonal">
      <v-icon icon="mdi-account-circle-outline" size="32" />
    </v-avatar>
    <div>
      <h6 class="text-h6 font-weight-bold mb-1">{{ fullName }}</h6>
      <p class="mb-0 text-body-2 text-medium-emphasis">@{{ username }} • Member since {{ memberSince }}</p>
    </div>
  </div>

  <v-list class="bg-transparent mb-2" nav>
    <v-list-item class="px-2l" to="/profile" prepend-icon="mdi-account-outline" title="Profile" rounded="lg" />
    <v-list-item class="px-2l" to="/settings/basic-info" prepend-icon="mdi-account-outline" title="Profile" rounded="lg" />
    <v-list-item class="px-2" to="/profile/blogs" prepend-icon="mdi-post-outline" title="My posts" rounded="lg" />
    <v-list-item class="px-2" to="/profile/applications" prepend-icon="mdi-apps" title="My applications" rounded="lg" />
  </v-list>

  <v-divider class="mb-4" />
  <v-list class="pa-0 bg-transparent">
    <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
    <v-list-item class="px-0"><strong>Téléphone:</strong>&nbsp; {{ phone }}</v-list-item>
    <v-list-item class="px-0"><strong>Localisation:</strong>&nbsp; {{ locationLabel }}</v-list-item>
  </v-list>
</template>

<style scoped>
.profile-sidebar-card {
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
}
</style>
