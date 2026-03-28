<script setup lang="ts">
import { useCurrentUserStore } from '~/stores/currentUser'

const currentUser = useCurrentUserStore()

const fullName = computed(() => currentUser.displayName)
const email = computed(() => currentUser.me?.email || '—')
const username = computed(() => currentUser.me?.username || '—')
const locationLabel = computed(() => currentUser.me?.profile?.location || '—')
const phone = computed(() => currentUser.me?.profile?.phone || '—')

const memberSince = computed(() => {
  const date = currentUser.me?.createdAt
  if (!date)
    return '-'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime()))
    return '-'

  return parsedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <NuxtLink to="/profile" class="text-decoration-none">
  <div class="d-flex align-center ga-3 mb-2">
      <UiAvatar :src="currentUser.me?.photo || '/images/placeholders/platform-media-fallback.svg'" :name="fullName" size="lg" />
      <div>
        <h4 class="text-h4 font-weight-bold mb-1">{{ fullName }}</h4>
        <p class="mb-0 text-body-2 text-medium-emphasis">Member since {{ memberSince }}</p>
      </div>
  </div>
  </NuxtLink>
  <v-list class="bg-transparent mb-2" nav>
    <v-list-item class="px-2l" to="/settings/basic-info" prepend-icon="mdi-cog-outline" title="Settings" rounded="lg" />
    <v-list-item class="px-2" to="/profile/blogs" prepend-icon="mdi-post-outline" title="My posts" rounded="lg" />
    <v-list-item class="px-2" to="/profile/applications" prepend-icon="mdi-apps" title="My applications" rounded="lg" />
    <v-list-item class="px-2" to="/profile/library" prepend-icon="mdi-folder-multiple-image" title="Library" rounded="lg" />
  </v-list>

  <v-divider class="mb-4" />
  <v-list class="pa-0 bg-transparent">
    <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
    <v-list-item class="px-0"><strong>Phone:</strong>&nbsp; {{ phone }}</v-list-item>
    <v-list-item class="px-0"><strong>Localisation:</strong>&nbsp; {{ locationLabel }}</v-list-item>
  </v-list>
</template>

<style scoped>
.profile-sidebar-card {
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
}
</style>
