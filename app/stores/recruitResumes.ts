import { defineStore } from 'pinia'

import type { RecruitResume, RecruitResumePayloadEntry } from '~/types/api/recruitResume'

const CACHE_TTL_MS = 60_000
const DEFAULT_CACHE_KEY = '__default__'

export const useRecruitResumesStore = defineStore('recruit-resumes', () => {
  const { apiFetch } = useApiClient()

  const cache = useState<Record<string, { items: RecruitResume[], cachedAt: number }>>('recruit-my-resumes-cache', () => ({}))

  const items = ref<RecruitResume[]>([])
  const isLoading = ref(false)

  const resolveScope = (applicationSlug?: string) => applicationSlug?.trim() || DEFAULT_CACHE_KEY

  const resolveBasePath = (applicationSlug?: string) => applicationSlug?.trim()
    ? `/api/v1/recruit/applications/${applicationSlug}/private/me/resumes`
    : '/api/v1/recruit/private/me/resumes'

  const resolveCreatePath = (applicationSlug?: string) => applicationSlug?.trim()
    ? `/api/v1/recruit/applications/${applicationSlug}/resumes`
    : '/api/v1/recruit/resumes'

  const fetchMine = async (options?: { force?: boolean, applicationSlug?: string }) => {
    const now = Date.now()
    const scope = resolveScope(options?.applicationSlug)
    const cacheEntry = cache.value[scope]

    if (!options?.force && cacheEntry && now - cacheEntry.cachedAt < CACHE_TTL_MS) {
      items.value = cacheEntry.items
      return items.value
    }

    isLoading.value = true

    try {
      const response = await apiFetch<RecruitResume[]>(resolveBasePath(options?.applicationSlug), {
        method: 'GET',
      })

      items.value = response
      cache.value[scope] = {
        items: response,
        cachedAt: now,
      }

      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const create = async (payload: { experiences: RecruitResumePayloadEntry[], skills: RecruitResumePayloadEntry[] }, applicationSlug?: string) => {
    const created = await apiFetch<Pick<RecruitResume, 'id'>>(resolveCreatePath(applicationSlug), {
      method: 'POST',
      body: payload,
    })

    await fetchMine({ force: true, applicationSlug })
    return created
  }


  const createFromDocument = async (document: File, applicationSlug?: string) => {
    const formData = new FormData()
    formData.append('experiences', '[]')
    formData.append('skills', '[]')
    formData.append('educations', '[]')
    formData.append('languages', '[]')
    formData.append('certifications', '[]')
    formData.append('projects', '[]')
    formData.append('references', '[]')
    formData.append('hobbies', '[]')
    formData.append('document', document)

    const created = await apiFetch<Pick<RecruitResume, 'id'>>(resolveCreatePath(applicationSlug), {
      method: 'POST',
      body: formData,
    })

    await fetchMine({ force: true, applicationSlug })
    return created
  }

  const update = async (id: string, payload: { experiences: RecruitResumePayloadEntry[], skills: RecruitResumePayloadEntry[] }, applicationSlug?: string) => {
    await apiFetch(`${resolveBasePath(applicationSlug)}/${id}`, {
      method: 'PATCH',
      body: payload,
    })

    await fetchMine({ force: true, applicationSlug })
  }

  const remove = async (id: string, applicationSlug?: string) => {
    const scope = resolveScope(applicationSlug)

    await apiFetch(`${resolveBasePath(applicationSlug)}/${id}`, {
      method: 'DELETE',
    })

    items.value = items.value.filter(item => item.id !== id)
    cache.value[scope] = {
      items: items.value,
      cachedAt: Date.now(),
    }
  }

  return {
    items,
    isLoading,
    fetchMine,
    create,
    createFromDocument,
    update,
    remove,
  }
})
