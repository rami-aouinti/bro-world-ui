<script setup lang="ts">
import { useCalendarEventsApi } from '~/composables/api/useCalendarEventsApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { CalendarEventRead } from '~/types/api/calendar'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const calendarApi = useCalendarEventsApi()

const { data: events, pending, error, execute: loadCalendar } = useAsyncData(
  () => `application-calendar-${slug.value}-${isAuthenticated.value ? 'private' : 'public'}`,
  async () => {
    return calendarApi.list(slug.value, isAuthenticated.value)
  },
  {
    watch: [slug, isAuthenticated],
    server: false,
    immediate: false,
    default: () => [] as CalendarEventRead[],
  },
)

onMounted(() => {
  void loadCalendar()
})
</script>

<template>
  <PlatformPluginPageShell title="Calendar" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le calendrier de cette platform.</v-alert>
    <v-skeleton-loader v-else-if="pending" type="list-item-two-line@5" class="mb-4" />

    <template v-else>
      <v-alert v-if="!events?.length" type="info" variant="tonal">
        Aucun événement trouvé pour cette application.
      </v-alert>

      <v-list v-else lines="two" density="comfortable" class="rounded-lg border">
        <v-list-item
          v-for="event in events"
          :key="event.id"
          :title="event.title"
          :subtitle="`${new Date(event.startAt).toLocaleString()} → ${new Date(event.endAt).toLocaleString()}`"
        >
          <template #append>
            <v-chip size="small" variant="tonal">{{ event.status }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </template>
  </PlatformPluginPageShell>
</template>
