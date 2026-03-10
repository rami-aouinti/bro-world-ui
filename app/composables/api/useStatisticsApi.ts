import { useApiClient } from '../useApiClient'
import type { AdminStatisticsResponse } from '~/types/api/statistics'

export const useStatisticsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getAdminStatistics() {
      return apiFetch<AdminStatisticsResponse>('/api/v1/statistics', {
        method: 'GET',
      })
    },
  }
}
