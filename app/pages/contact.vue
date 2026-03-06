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
      <h1 class="text-h4 font-weight-bold mb-3">{{ t('contact.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('contact.description') }}
      </p>
    </template>

    <v-list lines="two" class="bg-transparent pa-0">
      <v-list-item prepend-icon="mdi-email-outline" :title="t('contact.emailLabel')" :subtitle="t('contact.emailValue')" />
      <v-list-item prepend-icon="mdi-phone-outline" :title="t('contact.phoneLabel')" :subtitle="t('contact.phoneValue')" />
    </v-list>
  </UiPageSection>
</template>
