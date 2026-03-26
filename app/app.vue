<script setup lang="ts">
import { ref } from 'vue'
import UiPageSkeletonHost from '~/components/ui/state/UiPageSkeletonHost.vue'
import { useThemePreferences } from '~/composables/useThemePreferences'
import { useRealtimeBootstrap } from '~/composables/useRealtimeBootstrap'
import { useMercureOrchestrator } from '~/composables/useMercureOrchestrator'
import VercelAnalyticsPlaceholder from '~/components/layout/analytics/VercelAnalyticsPlaceholder'
import SpeedInsightsPlaceholder from '~/components/layout/analytics/SpeedInsightsPlaceholder'


const isPageLoading = ref(false)
const pageSkeletonKey = ref('')

const LazyAnalytics = defineAsyncComponent({
  loader: async () => {
    if (import.meta.server) {
      return VercelAnalyticsPlaceholder
    }

    const module = await import('@vercel/analytics/nuxt')
    return module.Analytics
  },
  suspensible: false,
})

const LazySpeedInsights = defineAsyncComponent({
  loader: async () => {
    if (import.meta.server) {
      return SpeedInsightsPlaceholder
    }

    const module = await import('@vercel/speed-insights/nuxt')
    return module.SpeedInsights
  },
  suspensible: false,
})

useThemePreferences()
useRealtimeBootstrap()
useMercureOrchestrator()
</script>

<template>
  <ClientOnly>
    <component :is="LazyAnalytics" />
    <component :is="LazySpeedInsights" />
  </ClientOnly>
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
