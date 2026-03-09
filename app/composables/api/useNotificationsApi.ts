import { useApiClient } from '../useApiClient'
import type { NotificationRead } from '~/types/api/notification'

export const useNotificationsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/notifications'

  return {
    getNotifications(limit = 20, offset = 0) {
      return apiFetch<NotificationRead[]>(basePath, {
        method: 'GET',
        query: {
          limit,
          offset,
        },
      })
    },
    getNotificationById(id: string) {
      return apiFetch<NotificationRead>(`${basePath}/${id}`, { method: 'GET' })
    },
  }
}
