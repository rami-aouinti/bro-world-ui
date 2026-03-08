<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const { t } = useI18n()
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))

await navigateTo(`/platform/${appSlug.value}/recruit/job/${jobSlug.value}`, { redirectCode: 301 })
</script>

<template>
  <div class="pa-6 text-body-2 text-medium-emphasis">
    {{ t('platform.recruit.jobs.redirecting') }}
  </div>
</template>
