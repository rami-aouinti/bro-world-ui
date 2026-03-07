<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { recruitJobs } from '~/data/platform-demo'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const filters = ref({ remoteOnly: false, contract: 'all' })
const { isOwner } = usePlatformPermissions(slug)
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value))

const visibleJobs = computed(() => recruitJobs.filter((job) => {
  if (filters.value.remoteOnly && !job.remote) return false
  if (filters.value.contract !== 'all' && job.type !== filters.value.contract) return false
  return true
}))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems">
        <v-divider class="my-4" />
        <p class="text-subtitle-2 mb-2">Filtres</p>
        <v-switch v-model="filters.remoteOnly" label="Remote only" color="primary" hide-details inset />
        <v-select v-model="filters.contract" :items="['all','CDI','CDD','Freelance','Internship']" density="comfortable" variant="outlined" label="Contrat" hide-details class="mt-3" />
      </PlatformSidebarNav>
    </template>

    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        Accès admin refusé : permissions insuffisantes pour cette application.
      </v-alert>
      <PlatformHeroHeader title="platform.recruit.hero.home.title" subtitle="platform.recruit.hero.home.subtitle" cta="platform.recruit.hero.home.cta" />
      <v-row>
        <v-col v-for="job in visibleJobs" :key="job.slug" cols="12" md="6">
          <v-card rounded="xl" hover :to="`/platform/${slug}/recruit/job/${job.slug}`">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2"><p class="font-weight-bold">{{ job.title }}</p><v-chip size="small" color="primary" variant="tonal">{{ job.type }}</v-chip></div>
              <p class="text-body-2 text-medium-emphasis">{{ job.company }} · {{ job.location }} · {{ job.salary }}</p>
              <p class="text-body-2 mt-2">{{ job.summary }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
