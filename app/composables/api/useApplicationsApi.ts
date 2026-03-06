import { useApiClient } from '../useApiClient'
import type { ApplicationRead } from '~/types/api/application'

export const useApplicationsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/application'

  return {
    listPublic() {
      return apiFetch<ApplicationRead[]>(`${basePath}/public`, {
        method: 'GET',
      })
    },
  }
}
