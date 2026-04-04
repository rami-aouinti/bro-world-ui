<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <UiPageShell :title="t('app.navigation.football')" :description="t('app.navigation.sport')">
    <v-card variant="tonal" class="pa-4">
      <p class="text-body-1 mb-3">
        {{ t('app.navigation.football') }}
      </p>
      <v-btn to="/sport/football/world-cup" color="primary" variant="flat" prepend-icon="mdi-trophy-outline">
        {{ t('worldCup.stadiums.title') }}
      </v-btn>
    </v-card>
  </UiPageShell>
</template>
