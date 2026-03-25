import { defineStore } from 'pinia'
import type { NotificationListResponse, NotificationRead } from '~/types/api/notification'

const DEFAULT_NOTIFICATIONS: NotificationListResponse = {
  items: [],
  unreadCount: 0,
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = useState<NotificationListResponse>('notifications-shared', () => ({ ...DEFAULT_NOTIFICATIONS }))

  const setNotifications = (payload: NotificationListResponse) => {
    notifications.value = {
      items: [...(payload.items ?? [])],
      unreadCount: payload.unreadCount ?? 0,
    }
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

  const clear = () => {
    notifications.value = { ...DEFAULT_NOTIFICATIONS }
  }

  return {
    notifications,
    setNotifications,
    prependNotification,
    markAllAsReadLocally,
    clear,
  }
})
