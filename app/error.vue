<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t, locale } = useI18n()

const isNotFound = computed(() => (props.error?.statusCode ?? 500) === 404)

const statusCode = computed(() => props.error?.statusCode ?? 500)

const errorTitle = computed(() => {
  return isNotFound.value ? t('errorPage.notFound.title') : t('errorPage.generic.title')
})

const errorSubtitle = computed(() => {
  return isNotFound.value ? t('errorPage.notFound.subtitle') : t('errorPage.generic.subtitle')
})

const errorDescription = computed(() => {
  if (isNotFound.value) {
    return t('errorPage.notFound.description')
  }

  return props.error?.statusMessage || t('errorPage.generic.description')
})

const debugMessage = computed(() => {
  if (process.dev && props.error?.message && !isNotFound.value) {
    return props.error.message
  }

  return ''
})

const goHome = async () => {
  await clearError({ redirect: '/' })
}

const goBack = async () => {
  if (import.meta.client && window.history.length > 1) {
    window.history.back()
    return
  }

  await clearError({ redirect: '/' })
}
</script>

<template>
  <v-container class="error-page d-flex align-center justify-center py-16">
    <v-card class="error-page__card pa-8 pa-sm-10" elevation="8" rounded="xl" max-width="760">
      <div class="d-flex justify-center mb-4">
        <v-chip color="primary" variant="tonal" size="small" class="text-uppercase font-weight-bold">
          {{ t('errorPage.badge') }}
        </v-chip>
      </div>

      <p class="text-h1 font-weight-black text-primary mb-2 error-page__status">{{ statusCode }}</p>

      <h1 class="text-h4 text-sm-h3 font-weight-bold mb-3">{{ errorTitle }}</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-2">{{ errorSubtitle }}</p>
      <p class="text-body-1 text-medium-emphasis mb-6">{{ errorDescription }}</p>

      <v-alert v-if="debugMessage" type="warning" variant="tonal" class="mb-6 text-left">
        {{ debugMessage }}
      </v-alert>

      <div class="error-page__actions">
        <v-btn color="primary" size="large" rounded="pill" @click="goHome">
          {{ t('errorPage.actions.home') }}
        </v-btn>
        <v-btn variant="outlined" size="large" rounded="pill" @click="goBack">
          {{ t('errorPage.actions.back') }}
        </v-btn>
      </div>

      <p class="text-caption text-medium-emphasis mt-8">
        {{ t('errorPage.localeHint', { locale: locale.toUpperCase() }) }}
      </p>
    </v-card>
  </v-container>
</template>

<style scoped>
.error-page {
  min-height: 75vh;
}

.error-page__card {
  width: min(760px, 100%);
  text-align: center;
}

.error-page__status {
  line-height: 1;
  letter-spacing: 0.04em;
}

.error-page__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
