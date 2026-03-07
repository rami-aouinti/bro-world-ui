<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { formatRecruitSalary, recruitJobs } from '~/data/platform/recruit'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const appSlug = computed(() => String(route.params.slug ?? ''))
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))
const job = computed(() => recruitJobs.find((item) => item.slug === jobSlug.value) ?? recruitJobs[0])
const relatedJobs = computed(() => recruitJobs.filter((item) => item.slug !== job.value.slug).slice(0, 3))

const navItems = computed(() => getRecruitNav(appSlug.value, true))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.jobDetail" :subtitle="job.company.name" :items="navItems" />
    </template>

    <section>
      <div class="d-flex align-start justify-space-between flex-wrap gap-4 mb-6">
        <div>
          <div class="d-flex align-center ga-4 mb-3">
            <v-avatar size="72" rounded="lg" color="deep-orange-lighten-4" class="text-deep-orange-darken-3 font-weight-bold">
              {{ job.company.logo }}
            </v-avatar>
            <h1 class="text-h4 font-weight-bold">{{ job.title }}</h1>
          </div>
          <p class="text-body-1 mb-2">
            {{ job.company.name }} · {{ job.location }} · {{ job.contractType }} · {{ job.workMode }} · {{ job.schedule }}
          </p>
          <p class="text-body-1 mb-0">{{ formatRecruitSalary(job.salary) }} (geschätzt für Vollzeit)</p>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-chip v-for="badge in job.badges" :key="badge" color="primary" variant="tonal">{{ badge }}</v-chip>
        </div>
      </div>

      <v-card rounded="xl" class="mb-6">
        <v-card-text class="pa-6">
          <h2 class="text-h5 font-weight-bold mb-2">Passt hervorragend</h2>
          <p class="text-body-1 mb-4">Du erfüllst alle Anforderungen für diese Stelle.</p>
          <v-progress-linear :model-value="job.matchScore" color="teal" height="14" rounded />
          <p class="text-caption mt-2 mb-0">Match: {{ job.matchScore }}%</p>
        </v-card-text>
      </v-card>

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-3">Einleitung</h2>
        <h3 class="text-h5 font-weight-bold mb-3">{{ job.missionTitle }}</h3>
        <p class="text-body-1">{{ job.missionDescription }}</p>
      </div>

      <v-divider class="my-6" />

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-3">Aufgaben</h2>
        <ul class="pl-6 text-body-1">
          <li v-for="item in job.responsibilities" :key="item" class="mb-2">{{ item }}</li>
        </ul>
      </div>

      <v-divider class="my-6" />

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-3">Profil</h2>
        <ul class="pl-6 text-body-1">
          <li v-for="item in job.profile" :key="item" class="mb-2">{{ item }}</li>
        </ul>
      </div>

      <v-divider class="my-6" />

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-3">Wir bieten</h2>
        <ul class="pl-6 text-body-1">
          <li v-for="item in job.benefits" :key="item" class="mb-2">{{ item }}</li>
        </ul>
      </div>

      <v-divider class="my-6" />

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-3">Gehalt</h2>
        <p class="text-h5 font-weight-bold mb-2">{{ formatRecruitSalary(job.salary) }} brutto/Jahr (geschätzt für Vollzeit)</p>
      </div>

      <v-divider class="my-6" />

      <div class="mb-8">
        <h2 class="text-h4 font-weight-bold mb-4">Diese Jobs waren bei anderen Jobsuchenden beliebt</h2>
        <v-card
          v-for="relatedJob in relatedJobs"
          :key="relatedJob.slug"
          rounded="xl"
          class="mb-4 border"
          :to="`/platform/${appSlug}/recruit/job/${relatedJob.slug}`"
        >
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between ga-4">
              <div>
                <h3 class="text-h5 font-weight-bold mb-2">{{ relatedJob.title }}</h3>
                <p class="text-body-1 mb-1">{{ relatedJob.company.name }} · {{ relatedJob.location }} · {{ relatedJob.workMode }}</p>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ relatedJob.postedAtLabel }}</p>
              </div>
              <v-avatar size="64" rounded="lg" color="deep-orange-lighten-4" class="text-deep-orange-darken-3 font-weight-bold">
                {{ relatedJob.company.logo }}
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </section>
  </PlatformSplitLayout>
</template>
