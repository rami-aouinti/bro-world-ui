<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { recruitJobs, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed<NavItem[]>(() => [
  { title: 'Jobs', icon: 'mdi-briefcase-search-outline', to: `/platform/${slug.value}/recruit/home` },
  { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `/platform/${slug.value}/recruit/admin` },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Recruit" :subtitle="`Admin ${slug}`" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-4">Admin Recruit</h1>
      <v-row>
        <v-col v-for="job in recruitJobs" :key="job.slug" cols="12" md="6">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ job.title }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ job.company }} · {{ job.type }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
