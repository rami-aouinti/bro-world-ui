<script setup lang="ts">
import { computed } from 'vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'

withDefaults(defineProps<{
  showPageSkeleton?: boolean
  pageSkeletonKey?: string
}>(), {
  showPageSkeleton: false,
  pageSkeletonKey: '',
})

const route = useRoute()
const { t } = useI18n()

const routeMessage = computed(() => {
  const key = typeof route.query.message === 'string' ? route.query.message : ''

  if (key === 'authRequired') {
    return t('errors.auth.authRequired')
  }

  if (key === 'accessDenied') {
    return t('errors.auth.accessDenied')
  }

  return ''
})
</script>

<template>
  <v-app>
    <AppBar />

    <v-main>
      <template v-if="showPageSkeleton">
        <slot name="layout-skeleton">
          <v-container fluid class="py-6">
            <v-skeleton-loader type="image" height="56" class="mb-6" />
            <v-skeleton-loader type="article" />
          </v-container>
        </slot>
      </template>

      <template v-else>
        <v-container
          v-if="routeMessage"
          class="pt-6 pb-0"
        >
          <UiStateAlert
            type="warning"
            variant="tonal"
            density="comfortable"
            :message="routeMessage"
          />
        </v-container>

        <slot />
      </template>
    </v-main>
  </v-app>
</template>
