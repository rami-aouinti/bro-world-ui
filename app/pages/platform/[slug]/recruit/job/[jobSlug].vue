<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { recruitJobs } from '~/data/platform-demo'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))
const job = computed(() => recruitJobs.find((item) => item.slug === jobSlug.value) ?? recruitJobs[0])

const { t } = useI18n()
const { formatRelativeShort } = usePlatformI18n()

const navItems = computed(() => getRecruitNav(appSlug.value, true))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.jobDetail" :subtitle="job.company" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-2">{{ job.title }}</h1>
      <p class="text-medium-emphasis mb-4">{{ job.company }} · {{ job.location }} · {{ job.salary }}</p>
      <v-chip-group>
        <v-chip v-for="tag in job.tags" :key="tag" color="primary" variant="tonal">{{ tag }}</v-chip>
      </v-chip-group>
      <v-card rounded="xl" class="mt-4">
        <v-card-text>
          <p>{{ job.summary }}</p>
          <p class="mt-3">{{ t('platform.recruit.job.published', { value: formatRelativeShort(job.postedAt) }) }} · {{ job.remote ? t('platform.recruit.job.remote') : t('platform.recruit.job.onsite') }}</p>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
