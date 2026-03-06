import { defineStore } from 'pinia'
import { useApplicationsApi } from '~/composables/api/useApplicationsApi'
import { useAuth } from '~/composables/useAuth'
import type { ApplicationRead, UpdateApplicationPayload } from '~/types/api/application'

export const useApplicationsStore = defineStore('applications', () => {
  const applicationsApi = useApplicationsApi()
  const { initSession, isAuthenticated } = useAuth()
  const items = ref<ApplicationRead[]>([])
  const isLoading = ref(false)

  const fetchPublic = async () => {
    isLoading.value = true

    try {
      items.value = await applicationsApi.listPublic()
      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const fetch = async () => {
    await initSession()
    isLoading.value = true

    try {
      items.value = isAuthenticated.value
        ? await applicationsApi.listPrivate()
        : await applicationsApi.listPublic()
      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, payload: UpdateApplicationPayload) => {
    const updated = await applicationsApi.update(id, payload)
    const idx = items.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      items.value[idx] = { ...items.value[idx], ...updated }
    }

    return updated
  }

  const disable = async (id: string) => {
    await applicationsApi.disable(id)
    items.value = items.value.filter(item => item.id !== id)
  }

  return {
    items,
    isLoading,
    fetchPublic,
    fetch,
    update,
    disable,
  }
})
