<script setup lang="ts">
import { settingsNavItems } from './settingsNav'

const route = useRoute()

const isActive = (to: string) => route.path === to
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Settings" subtitle="Manage your account preferences" />

      <UiCard rounded="lg" compact>
        <v-list nav density="comfortable" class="py-0">
          <v-list-item
            v-for="item in settingsNavItems"
            :key="item.to"
            :to="item.to"
            :active="isActive(item.to)"
            rounded="lg"
            class="mb-2"
          >
            <template #prepend>
              <v-icon :icon="item.icon" class="me-2" />
            </template>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </UiCard>
    </template>

    <template #default>
      <slot />
    </template>
  </PlatformSplitLayout>
</template>
