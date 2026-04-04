<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <UiPageShell :title="t('app.navigation.baseball')" :description="t('app.navigation.sport')">
    <v-card variant="tonal" class="pa-4">
      <p class="text-body-1 mb-0">
        {{ t('app.navigation.baseball') }}
      </p>
    </v-card>
  </UiPageShell>
</template>
