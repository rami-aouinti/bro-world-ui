<script setup lang="ts">
definePageMeta({
  middleware: ['role'],
  requiredRoles: ['ROLE_ADMIN'],
})

const { t } = useI18n()
</script>

<template>
  <v-container class="py-10" max-width="900">
    <v-card class="pa-6" rounded="xl" elevation="2">
      <h1 class="text-h5 font-weight-bold mb-3">{{ t('admin.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis">{{ t('admin.description') }}</p>
    </v-card>
  </v-container>
</template>
