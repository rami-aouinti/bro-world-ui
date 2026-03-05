<script setup lang="ts">
import { computed } from 'vue'

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
      <v-container
        v-if="routeMessage"
        class="pt-6 pb-0"
      >
        <v-alert
          type="warning"
          variant="tonal"
          density="comfortable"
        >
          {{ routeMessage }}
        </v-alert>
      </v-container>

      <slot />
    </v-main>
  </v-app>
</template>
