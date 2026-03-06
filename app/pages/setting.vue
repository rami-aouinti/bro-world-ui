<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

await navigateTo('/settings', { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
