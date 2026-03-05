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
      <h1 class="text-h4 font-weight-bold mb-3">{{ t('home.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('home.description') }}
      </p>
    </template>

    <v-btn color="primary" size="large" rounded="pill">{{ t('home.cta') }}</v-btn>
  </UiPageSection>
</template>
