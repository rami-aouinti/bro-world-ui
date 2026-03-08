<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { formatRecruitSalary, type RecruitJob } from '~/data/platform/recruit'
import { getRecruitNav } from '~/data/platform-nav'

type RecruitJobListResponse = {
  jobs?: RecruitJob[]
}

type RecruitApplicationStatus = 'WAITING' | 'REVIEWING' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'

type JobApplication = {
  id: string
  status: RecruitApplicationStatus
  createdAt: string
  applicant: {
    id: string
    coverLetter: string
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      email: string
    }
    resume: {
      id: string
    }
  }
}

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const appSlug = computed(() => String(route.params.slug ?? ''))
const jobSlug = computed(() => String(route.params.jobSlug ?? ''))
const { isAuthenticated, initSession } = useAuth()
const { apiFetch } = useApiClient()
const REQUEST_TIMEOUT_MS = 6000

const { t, locale } = useI18n()
const navItems = computed(() => getRecruitNav(appSlug.value, true, isAuthenticated.value))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs)
    }),
  ])
}

const fetchPrivateJobs = async (limit = 100) => {
  return await apiFetch<RecruitJobListResponse>('/api/v1/recruit/private/recruit-talent-hub/jobs', {
    method: 'GET',
    query: {
      page: 1,
      limit,
    },
  })
}

const fetchPublicJobs = async (limit = 100) => {
  return await apiFetch<RecruitJobListResponse>(`/api/v1/recruit/public/${appSlug.value}/jobs`, {
    method: 'GET',
    query: {
      page: 1,
      pageSize: limit,
    },
  })
}

const fetchJobsWithFallback = async (limit = 100) => {
  await initSession()

  if (isAuthenticated.value) {
    try {
      return await withTimeout(fetchPrivateJobs(limit), REQUEST_TIMEOUT_MS)
    } catch {
      // fallback public
    }
  }

  return await withTimeout(fetchPublicJobs(limit), REQUEST_TIMEOUT_MS)
}

const { data: job, pending, error } = await useAsyncData(
  () => `recruit-job-${jobSlug.value}`,
  async () => {
    const response = await fetchJobsWithFallback(100)

    const jobs = response.jobs ?? []
    return jobs.find(item => item.slug === jobSlug.value) ?? null
  },
  {
    watch: [jobSlug],
    default: () => null,
  },
)

const { data: relatedJobsData } = await useAsyncData(
  () => `recruit-related-jobs-${jobSlug.value}`,
  async () => {
    const response = await fetchJobsWithFallback(4)

    return response.jobs ?? []
  },
  {
    watch: [jobSlug],
    default: () => [],
  },
)

const relatedJobs = computed(() => (relatedJobsData.value ?? []).filter(item => item.slug !== job.value?.slug).slice(0, 3))

const { data: applications, pending: applicationsPending, refresh: refreshApplications } = await useAsyncData(
  () => `job-applications-${job.value?.id ?? 'none'}`,
  async () => {
    if (!job.value?.id || !job.value.owner) {
      return [] as JobApplication[]
    }

    const response = await apiFetch<JobApplication[]>('/api/v1/recruit/private/job-applications', {
      method: 'GET',
      query: {
        jobId: job.value.id,
      },
    })

    return response
  },
  {
    watch: [() => job.value?.id, () => job.value?.owner],
    default: () => [],
  },
)

const statusUpdateLoading = ref<string | null>(null)
const applicationActionError = ref('')
const statusOptions: RecruitApplicationStatus[] = ['WAITING', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'ACCEPTED']
const applicationStatusLabelMap = {
  WAITING: 'platform.recruit.status.waiting',
  REVIEWING: 'platform.recruit.status.reviewing',
  INTERVIEW: 'platform.recruit.status.interview',
  REJECTED: 'platform.recruit.status.rejected',
  ACCEPTED: 'platform.recruit.status.accepted',
} as const
const statusOptionsWithLabels = computed(() => statusOptions.map(status => ({
  title: t(applicationStatusLabelMap[status]),
  value: status,
})))

const updateApplicationStatus = async (applicationId: string, status: RecruitApplicationStatus) => {
  statusUpdateLoading.value = applicationId
  applicationActionError.value = ''

  try {
    await apiFetch(`/api/v1/recruit/private/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: {
        status,
      },
    })
    await refreshApplications()
  } catch {
    applicationActionError.value = t('platform.recruit.job.alerts.updateStatusError')
  } finally {
    statusUpdateLoading.value = null
  }
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.jobDetail" subtitle="platform.recruit.sidebar.jobDetailSubtitle" :items="navItems" />
    </template>

    <section>
      <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

      <v-alert v-else-if="error || !job" type="error" variant="tonal" class="mb-6">
        {{ t('platform.recruit.job.alerts.loadError') }}
      </v-alert>

      <template v-else>
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
            <p class="text-body-1 mb-0">{{ t('platform.recruit.job.estimatedFullTimeSalary', { salary: formatRecruitSalary(job.salary) }) }}</p>
          </div>
          <div class="d-flex ga-2 flex-wrap">
            <v-chip v-for="badge in job.badges" :key="badge" color="primary" variant="tonal">{{ badge }}</v-chip>
            <v-chip v-if="job.apply" color="indigo" variant="outlined">{{ t('platform.recruit.job.badges.applied') }}</v-chip>
          </div>
        </div>

        <v-card rounded="xl" class="mb-6">
          <v-card-text class="pa-6">
            <h2 class="text-h5 font-weight-bold mb-2">{{ t('platform.recruit.job.match.title') }}</h2>
            <p class="text-body-1 mb-4">{{ t('platform.recruit.job.match.description') }}</p>
            <v-progress-linear :model-value="job.matchScore" color="teal" height="14" rounded />
            <p class="text-caption mt-2 mb-0">{{ t('platform.recruit.job.match.score', { score: job.matchScore }) }}</p>
          </v-card-text>
        </v-card>

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ t('platform.recruit.job.sections.introduction') }}</h2>
          <h3 class="text-h5 font-weight-bold mb-3">{{ job.missionTitle }}</h3>
          <p class="text-body-1">{{ job.missionDescription }}</p>
        </div>

        <v-divider class="my-6" />

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ t('platform.recruit.job.sections.responsibilities') }}</h2>
          <ul class="pl-6 text-body-1">
            <li v-for="item in job.responsibilities" :key="item" class="mb-2">{{ item }}</li>
          </ul>
        </div>

        <v-divider class="my-6" />

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ t('platform.recruit.job.sections.profile') }}</h2>
          <ul class="pl-6 text-body-1">
            <li v-for="item in job.profile" :key="item" class="mb-2">{{ item }}</li>
          </ul>
        </div>

        <v-divider class="my-6" />

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ t('platform.recruit.job.sections.benefits') }}</h2>
          <ul class="pl-6 text-body-1">
            <li v-for="item in job.benefits" :key="item" class="mb-2">{{ item }}</li>
          </ul>
        </div>

        <v-divider class="my-6" />

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ t('platform.recruit.job.sections.salary') }}</h2>
          <p class="text-h5 font-weight-bold mb-2">{{ t('platform.recruit.job.grossSalaryPerYear', { salary: formatRecruitSalary(job.salary) }) }}</p>
        </div>

        <v-divider v-if="job.owner" class="my-6" />

        <div v-if="job.owner" class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-4">{{ t('platform.recruit.job.applications.title') }}</h2>
          <v-alert v-if="applicationActionError" type="error" variant="tonal" class="mb-4">
            {{ applicationActionError }}
          </v-alert>
          <v-skeleton-loader v-if="applicationsPending" type="article" class="mb-4" />
          <v-card v-for="application in applications" :key="application.id" rounded="xl" class="mb-4 border">
            <v-card-text class="pa-5">
              <div class="d-flex align-start justify-space-between flex-wrap ga-4">
                <div>
                  <p class="text-h6 mb-1">{{ application.applicant.user.firstName }} {{ application.applicant.user.lastName }}</p>
                  <p class="text-body-2 text-medium-emphasis mb-2">{{ application.applicant.user.email }} · @{{ application.applicant.user.username }}</p>
                  <p class="text-body-2 mb-2"><strong>{{ t('platform.recruit.job.applications.coverLetter') }}</strong> {{ application.applicant.coverLetter }}</p>
                  <p class="text-caption mb-0">{{ t('platform.recruit.job.applications.meta', { id: application.id, resumeId: application.applicant.resume.id }) }}</p>
                </div>
                <div style="min-width: 220px;">
                  <v-select
                    :model-value="application.status"
                    :items="statusOptionsWithLabels"
                    density="comfortable"
                    variant="outlined"
                    :label="t('platform.recruit.job.applications.statusLabel')"
                    :loading="statusUpdateLoading === application.id"
                    @update:model-value="(value) => updateApplicationStatus(application.id, value as RecruitApplicationStatus)"
                  />
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ new Date(application.createdAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US') }}
                  </p>
                </div>
              </div>
            </v-card-text>
          </v-card>
          <v-alert v-if="!applicationsPending && !applications.length" type="info" variant="tonal">
            {{ t('platform.recruit.job.applications.empty') }}
          </v-alert>
        </div>

        <v-divider class="my-6" />

        <div class="mb-8">
          <h2 class="text-h4 font-weight-bold mb-4">{{ t('platform.recruit.job.related.title') }}</h2>
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
      </template>
    </section>
  </PlatformSplitLayout>
</template>
