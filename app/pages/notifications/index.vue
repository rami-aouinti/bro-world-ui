<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useNotificationTarget } from '~/composables/useNotificationTarget'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'
import type { NotificationRead } from '~/types/api/notification'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const notificationsStore = useNotificationsStore()
const notificationsApi = useNotificationsApi()
const { initSession, authState } = useAuth()
const { resolveSensitiveError, isDebugMode } = useSensitivePageFeedback()
const notifications = computed<NotificationRead[]>(() => notificationsStore.notifications.items)
const { getNotificationTarget } = useNotificationTarget()
const isLoading = ref(false)
const errorMessage = ref('')
const errorRequestId = ref<string | null>(null)

const loadNotifications = async () => {
  isLoading.value = true
  errorMessage.value = ''
  errorRequestId.value = null

  try {
    await initSession()
    const response = await notificationsApi.getNotifications(100, 0)
    notificationsStore.setNotifications(response)
  }
  catch (error) {
    const resolved = resolveSensitiveError(error, {
      authState: authState.value,
      domain: 'notificationsPage',
      action: 'load',
      fallbackKey: 'errors.unknown',
    })
    errorMessage.value = resolved.message
    errorRequestId.value = resolved.requestId
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadNotifications)

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
          <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-3" />
          <v-alert v-if="errorMessage" type="warning" variant="tonal" class="mb-3">
            {{ errorMessage }}
            <div v-if="isDebugMode && errorRequestId" class="text-caption mt-1">requestId: {{ errorRequestId }}</div>
          </v-alert>

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
