<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <UiPageSection max-width="700">
    <template #header>
      <h1 class="text-h4 font-weight-bold mb-3">{{ t('settings.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('settings.description') }}
      </p>
    </template>

    <v-alert type="info" variant="tonal">
      {{ t('settings.notice') }}
    </v-alert>
  </UiPageSection>
</template>
