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
      <h1 class="text-h4 font-weight-bold mb-3">{{ t('platform.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('platform.description') }}
      </p>
    </template>

    <v-btn color="primary" rounded="pill" to="/contact">{{ t('platform.cta') }}</v-btn>
  </UiPageSection>
</template>
