<script setup lang="ts">
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { CalendarEventRead } from '~/types/api/calendar'
import { useCalendarEventsStore } from '~/stores/calendarEvents'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const { t } = useI18n()
const calendarEventsStore = useCalendarEventsStore()
const events = ref<CalendarEventRead[]>([])
const pending = ref(false)
const error = ref<unknown>(null)

const loadCalendar = async (force = false) => {
  pending.value = true
  error.value = null

  try {
    events.value = await calendarEventsStore.fetchList(slug.value, isAuthenticated.value, force)
  }
  catch (loadError) {
    error.value = loadError
    events.value = []
  }
  finally {
    pending.value = false
  }
}

onMounted(() => {
  void loadCalendar()
})

watch([slug, isAuthenticated], () => {
  void loadCalendar()
})
</script>

<template>
  <PlatformPluginPageShell title="Calendar" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ t('platform.errors.calendarLoad') }}</v-alert>
    <v-skeleton-loader v-else-if="pending" type="list-item-two-line@5" class="mb-4" />

    <template v-else>
      <v-alert v-if="!events?.length" type="info" variant="tonal">
        No event found for this application.
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
