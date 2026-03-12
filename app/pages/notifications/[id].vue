<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import type { NotificationRead } from '~/types/api/notification'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const route = useRoute()
const notificationsApi = useNotificationsApi()

const notificationId = computed(() => String(route.params.id || ''))

const { data: notification, pending, error } = await useAsyncData<NotificationRead | null>(
  () => `notification-${notificationId.value}`,
  async () => {
    if (!notificationId.value) {
      return null
    }

    return notificationsApi.getNotificationById(notificationId.value)
  },
  {
    default: () => null,
    watch: [notificationId],
  },
)

const fromLabel = computed(() => {
  if (!notification.value?.from) {
    return 'System'
  }

  return `${notification.value.from.firstName} ${notification.value.from.lastName}`.trim()
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Notification"
        subtitle="Détails"
      />

      <v-btn to="/notifications" variant="outlined" prepend-icon="mdi-arrow-left" block>
        Go back
      </v-btn>
    </template>

    <v-row>
      <v-col cols="12">
        <UiListCard v-if="pending">
          <v-skeleton-loader type="avatar, heading, text@4" />
        </UiListCard>

        <UiListCard v-else-if="notification && !error">
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar v-if="notification.from?.photo" size="44">
              <v-img :src="notification.from.photo" :alt="fromLabel" cover />
            </v-avatar>
            <v-avatar v-else size="44" color="primary" variant="tonal">
              <v-icon icon="mdi-earth" />
            </v-avatar>

            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">{{ notification.title }}</p>
              <p class="text-caption text-medium-emphasis mb-0">{{ fromLabel }}</p>
            </div>
          </div>

          <p class="text-body-1 mb-2">{{ notification.description }}</p>
          <p class="text-caption text-medium-emphasis mb-0">{{ notification.createdAt }}</p>
        </UiListCard>

        <UiListCard v-else>
          <v-alert
            type="warning"
            variant="tonal"
            title="Notification introuvable"
            text="Impossible de charger la notification demandée."
          />
        </UiListCard>
      </v-col>
    </v-row>
  </PlatformSplitLayout>
</template>
