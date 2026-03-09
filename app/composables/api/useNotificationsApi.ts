import { useApiClient } from '../useApiClient'
import type { NotificationListResponse, NotificationRead } from '~/types/api/notification'

export const useNotificationsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/notifications'

  return {
    getNotifications(limit = 20, offset = 0) {
      return apiFetch<NotificationListResponse>(basePath, {
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

    markAllAsRead() {
      return apiFetch<void>(`${basePath}/read-all`, {
        method: 'PATCH',
        body: {},
      })
    },
  }
}
