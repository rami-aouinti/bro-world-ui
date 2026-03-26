<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NotificationRead } from '~/types/api/notification'
import { useNotificationTarget } from '~/composables/useNotificationTarget'
import { useNotificationsStore } from '~/stores/notifications'

const { t, locale } = useI18n({ useScope: 'global' })
const notificationsStore = useNotificationsStore()
const { getNotificationTarget } = useNotificationTarget()
const isNotificationsMenuOpen = ref(false)

const notificationsSummary = computed(() => notificationsStore.notifications)
const notificationPreviewItems = computed(() => notificationsSummary.value.items.slice(0, 3))
const unreadNotificationsCount = computed(() => notificationsSummary.value.unreadCount)

watch(isNotificationsMenuOpen, async (isOpen) => {
  if (!isOpen || unreadNotificationsCount.value === 0) {
    return
  }

  notificationsStore.markAllAsReadLocally()
})

const getNotificationAvatarLabel = (notification: NotificationRead) => {
  if (!notification.from) {
    return notification.type
  }

  return `${notification.from.firstName} ${notification.from.lastName}`.trim()
}

const truncateText = (value: string | null | undefined, maxLength = 20) => {
  if (!value) {
    return ''
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value
}

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = date.getTime() - Date.now()
  const absDiffMs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  if (absDiffMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute')
  }

  if (absDiffMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour')
  }

  return rtf.format(Math.round(diffMs / day), 'day')
}
</script>

<template>
  <v-menu location="bottom end" v-model="isNotificationsMenuOpen">
    <template #activator="{ props }">
      <v-btn
        icon
        variant="text"
        class="app-bar__icon-btn"
        v-bind="props"
        :aria-label="t('app.navigation.notifications')"
      >
        <v-badge :model-value="unreadNotificationsCount > 0" :content="unreadNotificationsCount" color="error" offset-x="2" offset-y="2">
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </template>

    <v-list class="py-1 app-bar__menu" min-width="320">
      <v-list-item
        v-for="notification in notificationPreviewItems"
        :key="notification.id"
        :to="getNotificationTarget(notification) ?? `/notifications/${notification.id}`"
        rounded="lg"
        class="mx-2 my-1 app-bar__message-item"
      >
        <template #prepend>
          <v-avatar v-if="notification.from?.photo" size="34" class="me-3">
            <v-img :src="notification.from.photo" :alt="getNotificationAvatarLabel(notification)" cover />
          </v-avatar>
          <v-avatar v-else size="34" color="primary" variant="tonal" class="me-3">
            <v-icon icon="mdi-earth" size="18" />
          </v-avatar>
        </template>

        <div class="app-bar__message-content">
          <v-list-item-title class="font-weight-medium text-truncate">{{ truncateText(notification.title) }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ truncateText(notification.description) }}</v-list-item-subtitle>
        </div>

        <template #append>
          <span class="app-bar__message-time text-caption text-medium-emphasis">{{ formatRelativeTime(notification.createdAt) }}</span>
        </template>
      </v-list-item>

      <v-list-item
        to="/notifications"
        rounded="lg"
        class="mx-2 my-1 text-primary"
        :title="t('app.common.showAll')"
        prepend-icon="mdi-arrow-right"
      />
    </v-list>
  </v-menu>
</template>
