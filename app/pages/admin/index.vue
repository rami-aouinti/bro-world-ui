<script setup lang="ts">
definePageMeta({
  middleware: ['role'],
  requiredRoles: ['ROLE_ADMIN'],
})

const { t } = useI18n()
</script>

<template>
  <UiPageSection max-width="900" :title="t('admin.title')">
    <p class="text-body-1 text-medium-emphasis">{{ t('admin.description') }}</p>
  </UiPageSection>
</template>
