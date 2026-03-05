<script setup lang="ts">
definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()
</script>

<template>
  <UiPageSection max-width="900" :title="t('admin.title')">
    <p class="text-body-1 text-medium-emphasis">{{ t('admin.description') }}</p>
  </UiPageSection>
</template>
