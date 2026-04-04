<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

await navigateTo('/sport/football/world-cup', {
  redirectCode: 301,
  replace: true,
})
</script>

<template>
  <div class="pa-6 text-body-1">
    Redirecting to <NuxtLink to="/sport/football/world-cup">/sport/football/world-cup</NuxtLink>...
  </div>
</template>
