import type { NotificationRead } from '~/types/api/notification'

const REDIRECT_NOTIFICATION_TYPES = new Set(['friend_notification', 'blog_notification'])

const notificationPathPattern = /\/(?:user\/[^/\s]+\/profile|blog\/post\/[^/\s]+)/

export const useNotificationTarget = () => {
  const getNotificationTarget = (notification: Pick<NotificationRead, 'type' | 'description'>): string | null => {
    if (!REDIRECT_NOTIFICATION_TYPES.has(notification.type)) {
      return null
    }

    const matchedPath = notification.description.match(notificationPathPattern)?.[0]
    if (!matchedPath) {
      return null
    }

    return matchedPath.replace(/[),.;!?]+$/g, '')
  }

  return {
    getNotificationTarget,
  }
}
