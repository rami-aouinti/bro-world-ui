<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

await navigateTo('/settings/basic-info', { replace: true })
</script>

<template>
  <div />
</template>
