import { useApiClient } from '../useApiClient'
import type { ApplicationRead, UpdateApplicationPayload } from '~/types/api/application'

export const useApplicationsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/application'

  return {
    listPublic() {
      return apiFetch<ApplicationRead[]>(`${basePath}/public`, {
        method: 'GET',
      })
    },
    listPrivate() {
      return apiFetch<ApplicationRead[]>(`${basePath}/private`, {
        method: 'GET',
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
