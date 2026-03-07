<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { recruitJobs, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))
const job = computed(() => recruitJobs.find((item) => item.slug === jobSlug.value) ?? recruitJobs[0])

const navItems = computed<NavItem[]>(() => [
  { title: 'Jobs', icon: 'mdi-briefcase-search-outline', to: `/platform/${appSlug.value}/recruit/home` },
  { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `/platform/${appSlug.value}/recruit/admin` },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Job detail" :subtitle="job.company" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-2">{{ job.title }}</h1>
      <p class="text-medium-emphasis mb-4">{{ job.company }} · {{ job.location }} · {{ job.salary }}</p>
      <v-chip-group>
        <v-chip v-for="tag in job.tags" :key="tag" color="primary" variant="tonal">{{ tag }}</v-chip>
      </v-chip-group>
      <v-card rounded="xl" class="mt-4">
        <v-card-text>
          <p>{{ job.summary }}</p>
          <p class="mt-3">Publication: {{ job.postedAt }} · {{ job.remote ? 'Remote possible' : 'On-site' }}</p>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
