import { defineStore } from 'pinia'
import { useApplicationsApi } from '~/composables/api/useApplicationsApi'
import type { ApplicationRead } from '~/types/api/application'

export const useApplicationsStore = defineStore('applications', () => {
  const applicationsApi = useApplicationsApi()
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

  return {
    items,
    isLoading,
    fetchPublic,
  }
})
