<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slugParam = computed(() => route.params.slug)
const platformSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[0] ?? '') : String(slugParam.value ?? ''))
const jobSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[1] ?? '') : String(slugParam.value ?? ''))

await navigateTo(`/platform/${platformSlug.value}/recruit/job/${jobSlug.value}`, { redirectCode: 301 })
</script>

<template>
  <div class="pa-6 text-body-2 text-medium-emphasis">
    Redirection vers la nouvelle URL...
  </div>
</template>
