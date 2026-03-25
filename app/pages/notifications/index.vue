<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useNotificationTarget } from '~/composables/useNotificationTarget'
import type { NotificationRead } from '~/types/api/notification'
import { useMercureEventSource } from '~/composables/useMercureEventSource'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const authSession = useAuthSessionStore()
const notificationsStore = useNotificationsStore()
const notifications = computed<NotificationRead[]>(() => notificationsStore.notifications.items)
const { getNotificationTarget } = useNotificationTarget()

const mercureTopics = computed(() => authSession.profile?.id
  ? [`/users/${authSession.profile.id}/notifications`]
  : [])

useMercureEventSource(mercureTopics, (payload) => {
  if (!payload || typeof payload !== 'object') {
    return
  }

  const candidate = payload as Record<string, unknown>
  if (
    typeof candidate.id !== 'string'
    || typeof candidate.title !== 'string'
    || typeof candidate.type !== 'string'
  ) {
    return
  }

  notificationsStore.prependNotification({
    id: candidate.id,
    title: candidate.title,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    type: candidate.type,
    read: false,
    createdAt: new Date().toISOString(),
    from: null,
  })
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Notifications"
        subtitle="Centre de notifications"
      />

      <p class="text-body-2 text-medium-emphasis mb-3">Consultez toutes vos notifications.</p>
    </template>

    <v-row>
      <v-col cols="12">
        <UiListCard>
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">All Notifications</h2>
            <v-chip color="primary" size="small" variant="tonal">{{ notifications?.length }}</v-chip>
          </div>

          <v-list class="bg-transparent pa-0" lines="one">
            <v-list-item
              v-for="item in notifications"
              :key="item.id"
              :to="getNotificationTarget(item) ?? `/notifications/${item.id}`"
              class="notifications-page__item px-0 rounded-lg"
            >
              <template #prepend>
                <v-avatar v-if="item.from?.photo" size="34" class="me-3">
                  <v-img :src="item.from.photo" :alt="`${item.from.firstName} ${item.from.lastName}`" cover />
                </v-avatar>
                <v-avatar v-else color="primary" variant="tonal" size="34" class="me-3">
                  <v-icon icon="mdi-earth" size="18" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </UiListCard>
      </v-col>
    </v-row>
  </PlatformSplitLayout>
</template>

<style scoped>
.notifications-page__item {
  transition: background-color 0.2s ease;
}

.notifications-page__item + .notifications-page__item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.notifications-page__item:hover,
.notifications-page__item:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
