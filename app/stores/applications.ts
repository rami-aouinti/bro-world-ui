import { defineStore } from 'pinia'
import { useApplicationsApi } from '~/composables/api/useApplicationsApi'
import { useAuth } from '~/composables/useAuth'
import type { ApplicationListFilters, ApplicationListPagination, ApplicationRead, UpdateApplicationPayload } from '~/types/api/application'

const defaultPagination = (): ApplicationListPagination => ({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
})

export const useApplicationsStore = defineStore('applications', () => {
  const applicationsApi = useApplicationsApi()
  const { initSession, isAuthenticated } = useAuth()
  const items = ref<ApplicationRead[]>([])
  const isLoading = ref(false)
  const pagination = ref<ApplicationListPagination>(defaultPagination())
  const filters = ref<ApplicationListFilters>({
    search: '',
    platformKey: '',
  })

  const setFilters = (nextFilters: ApplicationListFilters) => {
    filters.value = {
      ...filters.value,
      ...nextFilters,
    }
  }

  const setPage = (page: number) => {
    pagination.value.page = page
  }

  const fetchPublic = async (params?: { page?: number, limit?: number, filters?: ApplicationListFilters }) => {
    isLoading.value = true

    try {
      if (params?.filters) {
        setFilters(params.filters)
      }
      pagination.value.page = params?.page ?? pagination.value.page
      pagination.value.limit = params?.limit ?? pagination.value.limit

      const response = await applicationsApi.listPublic({
        page: pagination.value.page,
        limit: pagination.value.limit,
        filters: filters.value,
      })
      items.value = response.items
      pagination.value = response.pagination
      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const fetch = async (params?: { page?: number, limit?: number, filters?: ApplicationListFilters }) => {
    await initSession()
    isLoading.value = true

    try {
      if (params?.filters) {
        setFilters(params.filters)
      }
      pagination.value.page = params?.page ?? pagination.value.page
      pagination.value.limit = params?.limit ?? pagination.value.limit

      const response = isAuthenticated.value
        ? await applicationsApi.listPrivate({
            page: pagination.value.page,
            limit: pagination.value.limit,
            filters: filters.value,
          })
        : await applicationsApi.listPublic({
            page: pagination.value.page,
            limit: pagination.value.limit,
            filters: filters.value,
          })

      items.value = response.items
      pagination.value = response.pagination
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
    pagination,
    filters,
    setFilters,
    setPage,
    fetchPublic,
    fetch,
    update,
    disable,
  }
})
