<script setup lang="ts">
import { settingsNavItems } from './settingsNav'
import {useCurrentUserStore} from "~/stores/currentUser";

const route = useRoute()
const currentUser = useCurrentUserStore()
const fullName = computed(() => currentUser.displayName)
const memberSince = computed(() => {
  const date = currentUser.me?.createdAt
  if (!date)
    return '-'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime()))
    return '-'

  return parsedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})
const isActive = (to: string) => route.path === to
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <NuxtLink to="/profile" class="text-decoration-none">
      <div class="d-flex align-center ga-3 mb-2">
        <UiAvatar :src="currentUser.me?.photo || '/images/placeholders/platform-media-fallback.svg'" :name="fullName" size="lg" />
        <div>
          <h4 class="text-h4 font-weight-bold mb-1">{{ fullName }}</h4>
          <p class="mb-0 text-body-2 text-medium-emphasis">Member since {{ memberSince }}</p>
        </div>
      </div>
      </NuxtLink>
      <v-list nav class=" mb-2">
        <v-list-item
          v-for="item in settingsNavItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" class="me-2" />
          </template>
          <v-list-item-title>{{ item.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>

    <template #default>
      <slot />
    </template>
  </PlatformSplitLayout>
</template>
