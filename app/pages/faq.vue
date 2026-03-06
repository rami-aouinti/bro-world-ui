<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <UiPageSection max-width="760">
    <template #header>
      <h1 class="text-h4 font-weight-bold mb-3">{{ t('faq.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('faq.description') }}
      </p>
    </template>

    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>{{ t('faq.q1') }}</v-expansion-panel-title>
        <v-expansion-panel-text>{{ t('faq.a1') }}</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>{{ t('faq.q2') }}</v-expansion-panel-title>
        <v-expansion-panel-text>{{ t('faq.a2') }}</v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </UiPageSection>
</template>
