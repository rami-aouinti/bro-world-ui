import type { Ref } from 'vue'

type RecruitCreatedJob = {
  id: string
  slug: string
  title: string
  company: string
  location: string
  contractType: string
  workMode: string
  schedule: string
  createdAt: string
}

type RecruitAppliedJobItem = {
  applicationId: string
  status: string
  appliedAt: string
  job: {
    id: string
    slug: string
    title: string
    company: string
    location: string
    contractType: string
    workMode: string
    schedule: string
  }
}

type RecruitMeJobsResponse = {
  createdJobs?: RecruitCreatedJob[]
  appliedJobs?: RecruitAppliedJobItem[]
}

const CACHE_TTL_MS = 60_000

export const refreshRecruitMeJobsState = async (slug: string) => {
  const cache = useState<Record<string, { data: RecruitMeJobsResponse, cachedAt: number }>>(
    'recruit-me-jobs-cache',
    () => ({}),
  )

  delete cache.value[slug]
  await refreshNuxtData(`recruit-me-jobs-${slug}`)
}

export const useRecruitMeJobs = (slug: Ref<string>) => {
  const { apiFetch } = useApiClient()
  const { initSession, isAuthenticated } = useAuth()

  const cache = useState<Record<string, { data: RecruitMeJobsResponse, cachedAt: number }>>(
    'recruit-me-jobs-cache',
    () => ({}),
  )

  return useAsyncData(
    () => `recruit-me-jobs-${slug.value}`,
    async () => {
      await initSession()

      if (!isAuthenticated.value) {
        return {
          createdJobs: [],
          appliedJobs: [],
        }
      }

      const cacheEntry = cache.value[slug.value]
      const now = Date.now()

      if (cacheEntry && now - cacheEntry.cachedAt < CACHE_TTL_MS) {
        return cacheEntry.data
      }

      const response = await apiFetch<RecruitMeJobsResponse>(`/api/v1/recruit/applications/${slug.value}/private/me/jobs`, {
        method: 'GET',
      })

      const normalizedResponse: RecruitMeJobsResponse = {
        createdJobs: response.createdJobs ?? [],
        appliedJobs: response.appliedJobs ?? [],
      }

      cache.value[slug.value] = {
        data: normalizedResponse,
        cachedAt: now,
      }

      return normalizedResponse
    },
    {
      watch: [slug],
      default: () => ({
        createdJobs: [],
        appliedJobs: [],
      }),
      lazy: true,
      server: false,
      dedupe: 'defer',
    },
  )
}
