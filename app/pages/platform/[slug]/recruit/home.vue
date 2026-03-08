<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { formatRecruitSalary, type RecruitContractType, type RecruitJob } from '~/data/platform/recruit'
import { getRecruitNav } from '~/data/platform-nav'

interface RecruitJobsApiResponse {
  jobs: RecruitJob[]
}

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const filters = ref<{ contract: RecruitContractType | 'all', workMode: RecruitJob['workMode'] | 'all' }>({
  contract: 'all',
  workMode: 'all',
})

const { isOwner } = usePlatformPermissions(slug)
const { initSession, isAuthenticated } = useAuth()
const { apiFetch } = useApiClient()
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value))

const { data: jobsData, pending, error } = await useAsyncData(
  () => `recruit-home-jobs-${slug.value}`,
  async () => {
    await initSession()

    const visibility = isAuthenticated.value ? 'private' : 'public'
    const endpoint = `/api/v1/recruit/${visibility}/${slug.value}/jobs`

    return apiFetch<RecruitJobsApiResponse>(endpoint, {
      method: 'GET',
    })
  },
  {
    watch: [slug],
    default: () => ({ jobs: [] }),
  },
)

const visibleJobs = computed(() => jobsData.value.jobs.filter((job) => {
  if (filters.value.contract !== 'all' && job.contractType !== filters.value.contract)
    return false
  if (filters.value.workMode !== 'all' && job.workMode !== filters.value.workMode)
    return false
  return true
}))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems">
        <v-divider class="my-4" />
        <p class="text-subtitle-2 mb-2">Filtres</p>
        <v-select
          v-model="filters.contract"
          :items="['all', 'CDI', 'CDD', 'Freelance', 'Internship']"
          density="comfortable"
          variant="outlined"
          label="Contrat"
          hide-details
        />
        <v-select
          v-model="filters.workMode"
          :items="['all', 'Onsite', 'Hybrid', 'Remote']"
          density="comfortable"
          variant="outlined"
          label="Mode"
          hide-details
          class="mt-3"
        />
      </PlatformSidebarNav>
    </template>

    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        Accès admin refusé : permissions insuffisantes pour cette application.
      </v-alert>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        Impossible de charger les offres d'emploi pour le moment.
      </v-alert>

      <PlatformHeroHeader
        title="platform.recruit.hero.home.title"
        subtitle="platform.recruit.hero.home.subtitle"
        cta="platform.recruit.hero.home.cta"
      />

      <v-skeleton-loader
        v-if="pending"
        type="article"
        class="mb-4"
      />

      <v-card
        v-for="job in visibleJobs"
        :key="job.id"
        rounded="xl"
        class="mb-4 border"
        hover
        :to="`/platform/${slug}/recruit/job/${job.slug}`"
      >
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between gap-4">
            <div>
              <v-chip size="small" color="teal" variant="tonal" class="mb-3">
                Passt hervorragend
              </v-chip>
              <h2 class="text-h5 font-weight-bold mb-2">{{ job.title }}</h2>
              <p class="text-body-1 mb-2">{{ job.company.name }} · {{ job.location }} · {{ formatRecruitSalary(job.salary) }}</p>
              <p class="text-body-2 mb-3">{{ job.tags.join(' | ') }}</p>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ job.postedAtLabel }}</p>
            </div>
            <v-avatar size="72" rounded="lg" color="deep-orange-lighten-4" class="text-deep-orange-darken-3 font-weight-bold">
              {{ job.company.logo }}
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
