<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { formatRecruitSalary, type RecruitContractType, type RecruitJob } from '~/data/platform/recruit'
import { getRecruitNav } from '~/data/platform-nav'

interface RecruitJobsApiResponse {
  jobs?: RecruitJob[]
  pagination?: {
    page?: number
    limit?: number
    totalItems?: number
    totalPages?: number
  }
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

type RecruitUpdateJobPayload = {
  title: string
  location: string
  contractType: RecruitContractType
  workMode: RecruitJob['workMode']
  schedule: string
  summary: string
  salaryMin: number
  salaryMax: number
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

const editDialog = ref(false)
const deleteDialog = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)
const ownerActionError = ref('')
const selectedJob = ref<RecruitJob | null>(null)
const editForm = ref<RecruitUpdateJobPayload>({
  title: '',
  location: '',
  contractType: 'CDI',
  workMode: 'Onsite',
  schedule: '',
  summary: '',
  salaryMin: 0,
  salaryMax: 0,
})

const loadEditForm = (job: RecruitJob) => {
  editForm.value = {
    title: job.title,
    location: job.location,
    contractType: job.contractType,
    workMode: job.workMode,
    schedule: job.schedule,
    summary: job.summary,
    salaryMin: job.salary.min,
    salaryMax: job.salary.max,
  }
}

const openEditDialog = (job: RecruitJob) => {
  selectedJob.value = job
  loadEditForm(job)
  ownerActionError.value = ''
  editDialog.value = true
}

const openDeleteDialog = (job: RecruitJob) => {
  selectedJob.value = job
  ownerActionError.value = ''
  deleteDialog.value = true
}

const closeOwnerDialogs = () => {
  editDialog.value = false
  deleteDialog.value = false
  selectedJob.value = null
}

const fetchRecruitJobsPrivate = async () => {
  return apiFetch<RecruitJobsApiResponse>('/api/v1/recruit/private/recruit-talent-hub/jobs', {
    method: 'GET',
    query: {
      page: currentPage.value,
      limit: DEFAULT_PAGE_SIZE,
      ...filterQuery.value,
    },
  })
}

const fetchRecruitJobsPublic = async () => {
  return apiFetch<RecruitJobsApiResponse>(`/api/v1/recruit/public/${slug.value}/jobs`, {
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
  const totalFromPagination = response?.pagination?.totalItems
  const total = typeof totalFromPagination === 'number'
    ? totalFromPagination
    : typeof response?.count === 'number'
      ? response.count
      : items.length

  return {
    jobs: items,
    total,
  }
}

const { data: jobsData, pending, error, refresh } = await useAsyncData(
  () => `recruit-home-jobs-${slug.value}-${currentPage.value}-${JSON.stringify(filterQuery.value)}`,
  async () => {
    await initSession()

    if (isAuthenticated.value) {
      try {
        const privateResponse = await fetchRecruitJobsPrivate()
        return normalizeJobsResponse(privateResponse)
      } catch {
        const publicResponse = await fetchRecruitJobsPublic()
        return normalizeJobsResponse(publicResponse)
      }
    }

    const publicResponse = await fetchRecruitJobsPublic()
    return normalizeJobsResponse(publicResponse)
  },
  {
    watch: [slug, currentPage, filterQuery],
    default: () => ({ jobs: [], total: 0 }),
  },
)

const submitEditJob = async () => {
  if (!selectedJob.value) {
    return
  }

  editLoading.value = true
  ownerActionError.value = ''

  try {
    const payload = {
      title: editForm.value.title.trim(),
      location: editForm.value.location.trim(),
      contractType: editForm.value.contractType,
      workMode: editForm.value.workMode,
      schedule: editForm.value.schedule.trim(),
      summary: editForm.value.summary.trim(),
      salary: {
        min: Math.max(0, Number(editForm.value.salaryMin) || 0),
        max: Math.max(0, Number(editForm.value.salaryMax) || 0),
        currency: 'EUR',
        period: 'year',
      },
    }

    await apiFetch(`/api/v1/recruit/private/recruit-talent-hub/jobs/${selectedJob.value.id}`, {
      method: 'PATCH',
      body: payload,
    })

    await refresh()
    closeOwnerDialogs()
  } catch {
    ownerActionError.value = "La mise à jour de l'offre a échoué."
  } finally {
    editLoading.value = false
  }
}

const submitDeleteJob = async () => {
  if (!selectedJob.value) {
    return
  }

  deleteLoading.value = true
  ownerActionError.value = ''

  try {
    await apiFetch(`/api/v1/recruit/private/recruit-talent-hub/jobs/${selectedJob.value.id}`, {
      method: 'DELETE',
    })

    await refresh()
    closeOwnerDialogs()
  } catch {
    ownerActionError.value = "La suppression de l'offre a échoué."
  } finally {
    deleteLoading.value = false
  }
}

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
          <div class="d-flex justify-end mb-2">
            <v-menu v-if="job.owner" location="bottom end">
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" @click.prevent />
              </template>
              <v-list density="compact" min-width="160">
                <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.prevent="openEditDialog(job)" />
                <v-list-item prepend-icon="mdi-delete" title="Delete" @click.prevent="openDeleteDialog(job)" />
              </v-list>
            </v-menu>
          </div>
          <div class="d-flex align-center justify-space-between gap-4">
            <div>
              <div class="d-flex align-center ga-2 flex-wrap mb-3">
                <v-chip size="small" color="teal" variant="tonal">
                  Passt hervorragend
                </v-chip>
                <v-chip v-if="job.apply" size="small" color="indigo" variant="outlined">
                  Applied
                </v-chip>
              </div>
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

  <v-dialog v-model="editDialog" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">Modifier l'offre</v-card-title>
      <v-card-text class="px-6 pb-0">
        <v-alert v-if="ownerActionError" type="error" variant="tonal" class="mb-4">
          {{ ownerActionError }}
        </v-alert>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field v-model="editForm.title" label="Titre" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="editForm.location" label="Ville" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="editForm.contractType" :items="['CDI', 'CDD', 'Freelance', 'Internship']" label="Contrat" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="editForm.workMode" :items="['Onsite', 'Hybrid', 'Remote']" label="Mode" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="editForm.schedule" label="Horaires" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model.number="editForm.salaryMin" type="number" min="0" label="Salaire min" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model.number="editForm.salaryMax" type="number" min="0" label="Salaire max" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="editForm.summary" label="Résumé" rows="4" auto-grow variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="closeOwnerDialogs">Annuler</v-btn>
        <v-btn color="primary" :loading="editLoading" @click="submitEditJob">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">Supprimer l'offre</v-card-title>
      <v-card-text class="px-6">
        <v-alert v-if="ownerActionError" type="error" variant="tonal" class="mb-4">
          {{ ownerActionError }}
        </v-alert>
        <p class="text-body-1 mb-0">
          Confirmez la suppression de l'offre
          <span class="font-weight-bold">{{ selectedJob?.title }}</span>
          ?
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="closeOwnerDialogs">Annuler</v-btn>
        <v-btn color="error" :loading="deleteLoading" @click="submitDeleteJob">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
