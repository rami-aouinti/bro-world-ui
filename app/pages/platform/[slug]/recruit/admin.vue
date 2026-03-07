<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { recruitJobs } from '~/data/platform-demo'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed(() => getRecruitNav(slug.value, true))
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
