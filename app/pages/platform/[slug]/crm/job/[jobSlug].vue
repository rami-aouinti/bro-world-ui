<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))

onMounted(() => {
  void navigateTo(`/platform/${appSlug.value}/recruit/job/${jobSlug.value}`, { redirectCode: 301 })
})
</script>

<template>
  <div />
</template>
