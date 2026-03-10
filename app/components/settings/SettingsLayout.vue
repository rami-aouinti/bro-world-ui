<script setup lang="ts">
import { settingsNavItems } from './settingsNav'
import { settingsKpis } from '~/data/settings-demo'

const route = useRoute()

const isActive = (to: string) => route.path === to
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <v-card rounded="xl" variant="tonal" color="primary" class="mb-4">
        <v-card-text>
          <p class="text-overline mb-1">Account center</p>
          <h3 class="text-h6 font-weight-bold mb-3">Settings</h3>
          <div class="d-flex flex-column ga-2">
            <div v-for="item in settingsKpis" :key="item.label" class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon :icon="item.icon" size="18" />
                <span class="text-body-2">{{ item.label }}</span>
              </div>
              <v-chip size="small" :color="item.color" variant="flat">{{ item.value }}</v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-list nav density="comfortable" class="py-0">
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
