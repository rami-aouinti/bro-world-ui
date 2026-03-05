<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-card rounded="xl" elevation="2" class="pa-6">
          <h1 class="text-h4 font-weight-bold mb-3">{{ t('home.title') }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-4">
            {{ t('home.description') }}
          </p>
          <v-btn color="primary" size="large" rounded="pill">{{ t('home.cta') }}</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
