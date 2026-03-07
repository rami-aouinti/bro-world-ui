import { useApiClient } from '../useApiClient'
import type { ApplicationListFilters, ApplicationListResponse, ApplicationRead, UpdateApplicationPayload } from '~/types/api/application'

export const useApplicationsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/application'

  const buildListQuery = (params?: { page?: number, limit?: number, filters?: ApplicationListFilters }) => {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 5
    const search = params?.filters?.search?.trim() ?? ''
    const platformKey = params?.filters?.platformKey?.trim() ?? ''

    return {
      page,
      limit,
      ...(search ? {
        title: search,
        description: search,
        platformName: search,
      } : {}),
      ...(platformKey ? { platformKey } : {}),
    }
  }

  return {
    listPublic(params?: { page?: number, limit?: number, filters?: ApplicationListFilters }) {
      return apiFetch<ApplicationListResponse>(`${basePath}/public`, {
        method: 'GET',
        query: buildListQuery(params),
      })
    },
    listPrivate(params?: { page?: number, limit?: number, filters?: ApplicationListFilters }) {
      return apiFetch<ApplicationListResponse>(`${basePath}/private`, {
        method: 'GET',
        query: buildListQuery(params),
      })
    },
    update(id: string, payload: UpdateApplicationPayload) {
      return apiFetch<ApplicationRead>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    disable(id: string) {
      return apiFetch<ApplicationRead>(`${basePath}/${id}`, {
        method: 'DELETE',
      })
    },
  }
}
