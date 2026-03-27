import { defineStore } from 'pinia'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'
import type { NotificationListResponse, NotificationRead } from '~/types/api/notification'

const DEFAULT_NOTIFICATIONS: NotificationListResponse = {
  items: [],
  unreadCount: 0,
}
const NOTIFICATIONS_CACHE_TTL_MS = 30_000

export const useNotificationsStore = defineStore('notifications', () => {
  const notificationsApi = useNotificationsApi()
  const notifications = useState<NotificationListResponse>('notifications-shared', () => ({ ...DEFAULT_NOTIFICATIONS }))
  const cachedAt = useState<number>('notifications-shared-cached-at', () => 0)
  const inFlightFetch = useState<Promise<NotificationListResponse> | null>('notifications-shared-inflight', () => null)
  const inFlightMarkAllAsRead = useState<Promise<void> | null>('notifications-shared-mark-all-read-inflight', () => null)

  const setNotifications = (payload: NotificationListResponse) => {
    notifications.value = {
      items: [...(payload.items ?? [])],
      unreadCount: payload.unreadCount ?? 0,
    }
    cachedAt.value = Date.now()
  }

  const fetchNotifications = async (force = false, options?: { limit?: number, offset?: number }) => {
    const hasFreshCache = !force
      && notifications.value.items.length > 0
      && Date.now() - cachedAt.value < NOTIFICATIONS_CACHE_TTL_MS

    if (hasFreshCache) {
      return notifications.value
    }

    if (inFlightFetch.value) {
      return inFlightFetch.value
    }

    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0
    inFlightFetch.value = notificationsApi
      .getNotifications(limit, offset)
      .then((response) => {
        setNotifications(response)
        return notifications.value
      })
      .finally(() => {
        inFlightFetch.value = null
      })

    return inFlightFetch.value
  }

  const prependNotification = (notification: NotificationRead, maxItems?: number) => {
    const alreadyExists = notifications.value.items.some(item => item.id === notification.id)

    if (alreadyExists) {
      return
    }

    const items = [notification, ...notifications.value.items]
    notifications.value = {
      unreadCount: notifications.value.unreadCount + 1,
      items: typeof maxItems === 'number' ? items.slice(0, maxItems) : items,
    }
  }

  const markAllAsReadLocally = () => {
    notifications.value = {
      unreadCount: 0,
      items: notifications.value.items.map(item => ({
        ...item,
        read: true,
      })),
    }
  }

  const markAllAsRead = async () => {
    if (notifications.value.unreadCount === 0) {
      return
    }

    if (inFlightMarkAllAsRead.value) {
      return inFlightMarkAllAsRead.value
    }

    const previousNotifications = {
      unreadCount: notifications.value.unreadCount,
      items: notifications.value.items.map(item => ({ ...item })),
    }

    markAllAsReadLocally()
    inFlightMarkAllAsRead.value = notificationsApi
      .markAllAsRead()
      .catch((error) => {
        notifications.value = previousNotifications
        throw error
      })
      .finally(() => {
        inFlightMarkAllAsRead.value = null
      })

    return inFlightMarkAllAsRead.value
  }

  const clear = () => {
    notifications.value = { ...DEFAULT_NOTIFICATIONS }
    cachedAt.value = 0
    inFlightFetch.value = null
    inFlightMarkAllAsRead.value = null
  }

  return {
    notifications,
    cachedAt,
    setNotifications,
    fetchNotifications,
    prependNotification,
    markAllAsRead,
    markAllAsReadLocally,
    clear,
  }
})
