import { defineStore } from 'pinia'

export type RecruitResumePayloadEntry = {
  title: string
  description: string
}

export type RecruitResumeEntry = RecruitResumePayloadEntry & {
  id: string
}

export type RecruitResume = {
  id: string
  documentUrl: string | null
  experiences: RecruitResumeEntry[]
  skills: RecruitResumeEntry[]
}

const CACHE_TTL_MS = 60_000

export const useRecruitResumesStore = defineStore('recruit-resumes', () => {
  const { apiFetch } = useApiClient()

  const cache = useState<{ items: RecruitResume[], cachedAt: number } | null>('recruit-my-resumes-cache', () => null)

  const items = ref<RecruitResume[]>([])
  const isLoading = ref(false)

  const fetchMine = async (options?: { force?: boolean }) => {
    const now = Date.now()

    if (!options?.force && cache.value && now - cache.value.cachedAt < CACHE_TTL_MS) {
      items.value = cache.value.items
      return items.value
    }

    isLoading.value = true

    try {
      const response = await apiFetch<RecruitResume[]>('/api/v1/recruit/private/me/resumes', {
        method: 'GET',
      })

      items.value = response
      cache.value = {
        items: response,
        cachedAt: now,
      }

      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const create = async (payload: { experiences: RecruitResumePayloadEntry[], skills: RecruitResumePayloadEntry[] }) => {
    const created = await apiFetch<Pick<RecruitResume, 'id'>>('/api/v1/recruit/resumes', {
      method: 'POST',
      body: payload,
    })

    await fetchMine({ force: true })
    return created
  }


  const createFromDocument = async (document: File) => {
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

    const created = await apiFetch<Pick<RecruitResume, 'id'>>('/api/v1/recruit/resumes', {
      method: 'POST',
      body: formData,
    })

    await fetchMine({ force: true })
    return created
  }

  const update = async (id: string, payload: { experiences: RecruitResumePayloadEntry[], skills: RecruitResumePayloadEntry[] }) => {
    await apiFetch(`/api/v1/recruit/private/me/resumes/${id}`, {
      method: 'PATCH',
      body: payload,
    })

    await fetchMine({ force: true })
  }

  const remove = async (id: string) => {
    await apiFetch(`/api/v1/recruit/private/me/resumes/${id}`, {
      method: 'DELETE',
    })

    items.value = items.value.filter(item => item.id !== id)
    cache.value = {
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
