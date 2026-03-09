<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const notificationsApi = useNotificationsApi()
const isLoading = ref(false)
const errorMessage = ref('')
const notificationsResponse = ref<any>(null)
const notifications = ref<any>(null)
const loadNotifications = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    notificationsResponse.value = await notificationsApi.getNotifications(100, 0)
    notifications.value = await notificationsResponse?.value?.items
} catch (error) {
  console.error(error)
  errorMessage.value = 'Impossible de charger les événements du calendrier.'
} finally {
  isLoading.value = false
}

}
onMounted(async () => {
  await loadNotifications()

  await nextTick()
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

          <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />

          <v-list v-else class="bg-transparent pa-0" lines="one">
            <v-list-item
              v-for="item in notifications"
              :key="item.id"
              :to="`/notifications/${item.id}`"
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
