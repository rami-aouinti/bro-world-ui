<script setup lang="ts">
import { ref } from 'vue'
import UiPageSkeletonHost from '~/components/ui/state/UiPageSkeletonHost.vue'
import { useThemePreferences } from '~/composables/useThemePreferences'
import { useRealtimeBootstrap } from '~/composables/useRealtimeBootstrap'
import { useMercureOrchestrator } from '~/composables/useMercureOrchestrator'

const isPageLoading = ref(false)
const pageSkeletonKey = ref('')

useThemePreferences()
useRealtimeBootstrap()
useMercureOrchestrator()
</script>

<template>
  <NuxtLayout
    :show-page-skeleton="isPageLoading"
    :page-skeleton-key="pageSkeletonKey"
  >
    <UiPageSkeletonHost
      v-model:loading="isPageLoading"
      v-model:skeleton-key="pageSkeletonKey"
    />
  </NuxtLayout>
</template>
