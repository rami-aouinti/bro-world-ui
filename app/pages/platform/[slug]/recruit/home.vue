<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { formatRecruitSalary, type RecruitContractType, type RecruitJob } from '~/data/platform/recruit'
import { getRecruitNav } from '~/data/platform-nav'

interface RecruitJobsApiResponse {
  jobs?: RecruitJob[]
  count?: number
  results?: RecruitJob[]
  next?: string | null
  previous?: string | null
}

type RecruitHomeFilters = {
  company: string
  salaryMin: number
  salaryMax: number
  contractType: RecruitContractType | ''
  workMode: RecruitJob['workMode'] | ''
  schedule: string
  postedAtLabel: string
  location: string
  q: string
}

definePageMeta({ public: true, requiresAuth: false })

const DEFAULT_PAGE_SIZE = 10

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const currentPage = ref(1)
const filters = ref<RecruitHomeFilters>({
  company: '',
  salaryMin: 0,
  salaryMax: 0,
  contractType: '',
  workMode: '',
  schedule: '',
  postedAtLabel: '',
  location: '',
  q: '',
})

const { isOwner } = usePlatformPermissions(slug)
const { initSession, isAuthenticated } = useAuth()
const { apiFetch } = useApiClient()
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const hasFilters = computed(() => Object.values(filters.value).some(value => {
  if (typeof value === 'number') {
    return value > 0
  }

  return value.trim() !== ''
}))

const filterQuery = computed(() => ({
  company: filters.value.company.trim(),
  salaryMin: Math.max(0, Number(filters.value.salaryMin) || 0),
  salaryMax: Math.max(0, Number(filters.value.salaryMax) || 0),
  contractType: filters.value.contractType,
  workMode: filters.value.workMode,
  schedule: filters.value.schedule.trim(),
  postedAtLabel: filters.value.postedAtLabel.trim(),
  location: filters.value.location.trim(),
  q: filters.value.q.trim(),
}))

const fetchRecruitJobs = async (visibility: 'public' | 'private') => {
  const endpoint = `/api/v1/recruit/${visibility}/${slug.value}/jobs`

  return apiFetch<RecruitJobsApiResponse>(endpoint, {
    method: 'GET',
    query: {
      page: currentPage.value,
      pageSize: DEFAULT_PAGE_SIZE,
      ...filterQuery.value,
    },
  })
}

const normalizeJobsResponse = (response: RecruitJobsApiResponse | null) => {
  const items = response?.jobs ?? response?.results ?? []
  const total = typeof response?.count === 'number' ? response.count : items.length

  return {
    jobs: items,
    total,
  }
}

const { data: jobsData, pending, error } = await useAsyncData(
  () => `recruit-home-jobs-${slug.value}-${currentPage.value}-${JSON.stringify(filterQuery.value)}`,
  async () => {
    await initSession()

    if (isAuthenticated.value) {
      try {
        const privateResponse = await fetchRecruitJobs('private')
        return normalizeJobsResponse(privateResponse)
      } catch {
        const publicResponse = await fetchRecruitJobs('public')
        return normalizeJobsResponse(publicResponse)
      }
    }

    const publicResponse = await fetchRecruitJobs('public')
    return normalizeJobsResponse(publicResponse)
  },
  {
    watch: [slug, currentPage, filterQuery],
    default: () => ({ jobs: [], total: 0 }),
  },
)

const totalPages = computed(() => {
  const total = jobsData.value.total
  return total > 0 ? Math.ceil(total / DEFAULT_PAGE_SIZE) : 1
})

const resetFilters = async () => {
  filters.value = {
    company: '',
    salaryMin: 0,
    salaryMax: 0,
    contractType: '',
    workMode: '',
    schedule: '',
    postedAtLabel: '',
    location: '',
    q: '',
  }
  currentPage.value = 1
}


watch(filterQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems">
        <v-divider class="my-4" />
        <div class="d-flex align-center justify-space-between mb-2">
          <p class="text-subtitle-2 mb-0">Filtres</p>
          <v-btn size="small" variant="text" :disabled="!hasFilters" @click="resetFilters">Réinitialiser</v-btn>
        </div>

        <v-text-field v-model="filters.q" density="comfortable" variant="outlined" label="Recherche" hide-details clearable class="mb-3" />
        <v-text-field v-model="filters.company" density="comfortable" variant="outlined" label="Entreprise" hide-details clearable class="mb-3" />
        <v-text-field v-model="filters.location" density="comfortable" variant="outlined" label="Localisation" hide-details clearable class="mb-3" />

        <v-select
          v-model="filters.contractType"
          :items="['', 'CDI', 'CDD', 'Freelance', 'Internship']"
          density="comfortable"
          variant="outlined"
          label="Type de contrat"
          hide-details
          class="mb-3"
        />

        <v-select
          v-model="filters.workMode"
          :items="['', 'Onsite', 'Hybrid', 'Remote']"
          density="comfortable"
          variant="outlined"
          label="Mode de travail"
          hide-details
          class="mb-3"
        />

        <v-text-field v-model="filters.schedule" density="comfortable" variant="outlined" label="Horaires" hide-details clearable class="mb-3" />
        <v-text-field v-model="filters.postedAtLabel" density="comfortable" variant="outlined" label="Publié" hide-details clearable class="mb-3" />

        <div class="d-flex ga-2">
          <v-text-field v-model.number="filters.salaryMin" type="number" min="0" density="comfortable" variant="outlined" label="Salaire min" hide-details class="mb-3" />
          <v-text-field v-model.number="filters.salaryMax" type="number" min="0" density="comfortable" variant="outlined" label="Salaire max" hide-details class="mb-3" />
        </div>
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
        v-for="job in jobsData.jobs"
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

      <v-alert
        v-if="!pending && !jobsData.jobs.length"
        type="info"
        variant="tonal"
      >
        Aucune offre trouvée. Essayez d'ajuster les filtres pour élargir la recherche.
      </v-alert>

      <div class="d-flex justify-center mt-6">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          rounded="circle"
        />
      </div>
    </section>
  </PlatformSplitLayout>
</template>
