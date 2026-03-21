<script setup lang="ts">
import type { Component } from 'vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { useCalendarEventsStore } from '~/stores/calendarEvents'
import { useLazyExternalLibs } from '~/composables/useLazyExternalLibs'
import { getCalendarNav } from '~/data/platform-nav'
import type {
  CalendarEventRead,
  CreateCalendarEventPayload,
  EventStatus,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'

const props = withDefaults(defineProps<{
  applicationSlug?: string
}>(), {
  applicationSlug: undefined,
})

const { isAuthenticated } = useAuth()
const { t, locale } = useI18n()
const calendarStore = useCalendarEventsStore()

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const usingFallbackData = ref(false)

const events = ref<CalendarEventRead[]>([])
const selectedRange = ref<'7days' | '30days' | 'quarter'>('30days')
const selectedStatus = ref<'all' | EventStatus>('all')
const selectedEventId = ref<string | null>(null)

const isCreateDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isShowDialogOpen = ref(false)
const fullCalendarRef = ref<{ getApi: () => { updateSize: () => void } } | null>(null)
const calendarContainerRef = ref<HTMLElement | null>(null)
const { loadFullCalendar, isLoading: isCalendarLibLoading } = useLazyExternalLibs()
const fullCalendarPlugins = ref<unknown[]>([])
const FullCalendarComponent = shallowRef<Component | null>(null)

let calendarResizeObserver: ResizeObserver | null = null

const canMutate = computed(() => isAuthenticated.value)
const usePrivateList = computed(() => !props.applicationSlug || isAuthenticated.value)

const eventForm = reactive({
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  location: '',
})

const rangeOptions = [
  { title: t('calendar.range.next7'), value: '7days' },
  { title: t('calendar.range.next30'), value: '30days' },
  { title: t('calendar.range.quarter'), value: 'quarter' },
]

const statusOptions = [
  { title: t('calendar.status.all'), value: 'all' },
  { title: t('calendar.status.confirmed'), value: 'confirmed' },
  { title: t('calendar.status.tentative'), value: 'tentative' },
  { title: t('calendar.status.cancelled'), value: 'cancelled' },
]

const rangeInDays = { '7days': 7, '30days': 30, 'quarter': 90 }

const toDateTimeLocalValue = (isoDate: string) => {
  const date = new Date(isoDate)
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60_000))
  return localDate.toISOString().slice(0, 16)
}

const formatEventDate = (isoDate: string) => {
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

const formatDayLabel = (isoDate: string) => {
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(isoDate))
}

const statusToChipColor = (status: EventStatus) => {
  if (status === 'confirmed') return 'success'
  if (status === 'tentative') return 'warning'
  return 'error'
}

const statusLabel = (status: EventStatus) => {
  if (status === 'confirmed') return t('calendar.status.confirmed')
  if (status === 'tentative') return t('calendar.status.tentative')
  return t('calendar.status.cancelled')
}

const fullCalendarColorByStatus: Record<EventStatus, string> = {
  confirmed: '#2E7D32',
  tentative: '#ED6C02',
  cancelled: '#D32F2F',
}

const isDemoEvent = (event: CalendarEventRead) => event.id.startsWith('demo-')

const loadEvents = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const apiEvents = await calendarStore.fetchList(props.applicationSlug, usePrivateList.value, true)
    const eventMap = new Map<string, CalendarEventRead>()

    for (const event of [...apiEvents]) {
      eventMap.set(event.id, event)
    }

    events.value = [...eventMap.values()]
  } catch (error) {
    console.error(error)
    errorMessage.value = 'API unavailable: displaying demo data.'
  } finally {
    isLoading.value = false
  }
}

const statusFilteredEvents = computed(() => {
  return events.value.filter(event => selectedStatus.value === 'all' || event.status === selectedStatus.value)
})

const filteredEvents = computed(() => {
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const maxDate = new Date(startDate)
  maxDate.setDate(startDate.getDate() + rangeInDays[selectedRange.value])

  return [...statusFilteredEvents.value]
    .filter((event) => {
      const eventStart = new Date(event.startAt)
      return eventStart >= startDate && eventStart <= maxDate
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
})

const selectedEvent = computed(() => events.value.find(event => event.id === selectedEventId.value) || null)

const upcomingEventsByDay = computed(() => {
  const groups = new Map<string, { day: string, events: CalendarEventRead[] }>()

  for (const event of filteredEvents.value.slice(0, 10)) {
    const dayKey = new Date(event.startAt).toDateString()
    if (!groups.has(dayKey)) {
      groups.set(dayKey, {
        day: formatDayLabel(event.startAt),
        events: [],
      })
    }

    groups.get(dayKey)?.events.push(event)
  }

  return [...groups.values()]
})

const dashboardStats = computed(() => {
  const today = new Date()
  const isToday = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  const confirmed = events.value.filter(event => event.status === 'confirmed').length
  const tentative = events.value.filter(event => event.status === 'tentative').length
  const cancelled = events.value.filter(event => event.status === 'cancelled').length

  return [
    {
      label: 'Today',
      value: events.value.filter(event => isToday(event.startAt)).length,
      icon: 'mdi-calendar-today',
      color: 'primary',
    },
    {
      label: 'Confirmeds',
      value: confirmed,
      icon: 'mdi-check-decagram-outline',
      color: 'success',
    },
    {
      label: 'Tentatifs',
      value: tentative,
      icon: 'mdi-progress-clock',
      color: 'warning',
    },
    {
      label: 'Cancelleds',
      value: cancelled,
      icon: 'mdi-close-octagon-outline',
      color: 'error',
    },
  ]
})

const calendarEvents = computed(() => {
  return statusFilteredEvents.value.map((event) => {
    const startAt = new Date(event.startAt)
    const endAt = new Date(event.endAt)
    const safeEndAt = endAt >= startAt ? event.endAt : event.startAt

    return {
      id: event.id,
      title: event.title,
      start: event.startAt,
      end: safeEndAt,
      allDay: event.isAllDay,
      color: fullCalendarColorByStatus[event.status],
    }
  })
})

const resetForm = () => {
  eventForm.title = ''
  eventForm.description = ''
  eventForm.startAt = ''
  eventForm.endAt = ''
  eventForm.location = ''
}

const openCreateDialog = (startAt?: string, endAt?: string) => {
  resetForm()
  eventForm.startAt = startAt ? toDateTimeLocalValue(startAt) : ''
  eventForm.endAt = endAt ? toDateTimeLocalValue(endAt) : ''
  isCreateDialogOpen.value = true
}

const openEditDialog = (event: CalendarEventRead) => {
  eventForm.title = event.title
  eventForm.description = event.description || ''
  eventForm.startAt = toDateTimeLocalValue(event.startAt)
  eventForm.endAt = toDateTimeLocalValue(event.endAt)
  eventForm.location = event.location || ''
  selectedEventId.value = event.id
  isEditDialogOpen.value = true
}

const openShowDialog = (event: CalendarEventRead) => {
  selectedEventId.value = event.id
  isShowDialogOpen.value = true
}

const buildPayload = (): CreateCalendarEventPayload => ({
  title: eventForm.title,
  description: eventForm.description,
  startAt: new Date(eventForm.startAt).toISOString(),
  endAt: new Date(eventForm.endAt).toISOString(),
  location: eventForm.location,
})

const submitCreate = async () => {
  if (!canMutate.value) return

  try {
    isSaving.value = true
    await calendarStore.create(buildPayload(), props.applicationSlug)
    isCreateDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = t('calendar.errors.create')
  } finally {
    isSaving.value = false
  }
}

const submitEdit = async () => {
  if (!selectedEventId.value || !canMutate.value) return

  try {
    isSaving.value = true
    const payload: PatchCalendarEventPayload = buildPayload()
    await calendarStore.patch(selectedEventId.value, payload, props.applicationSlug)
    isEditDialogOpen.value = false
    isShowDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = t('calendar.errors.edit')
  } finally {
    isSaving.value = false
  }
}

const cancelEvent = async (event: CalendarEventRead) => {
  if (!canMutate.value || isDemoEvent(event)) return

  try {
    isSaving.value = true
    await calendarStore.cancel(event.id, props.applicationSlug)
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = t('calendar.errors.cancel')
  } finally {
    isSaving.value = false
  }
}

const deleteEvent = async (event: CalendarEventRead) => {
  if (!canMutate.value || isDemoEvent(event)) return

  try {
    isSaving.value = true
    await calendarStore.deleteEvent(event.id, props.applicationSlug)
    if (selectedEventId.value === event.id) selectedEventId.value = null
    isShowDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = t('calendar.errors.delete')
  } finally {
    isSaving.value = false
  }
}

const patchFromCalendarMove = async (eventId: string, startAt?: string, endAt?: string) => {
  if (!canMutate.value || !startAt || eventId.startsWith('demo-')) return

  try {
    isSaving.value = true
    await calendarStore.patch(eventId, {
      startAt,
      endAt: endAt || startAt,
    }, props.applicationSlug)
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = t('calendar.errors.moveResize')
  } finally {
    isSaving.value = false
  }
}

const refreshCalendarGeometry = () => {
  fullCalendarRef.value?.getApi().updateSize()
}

const scheduleCalendarRefresh = () => {
  requestAnimationFrame(refreshCalendarGeometry)
}

const observeCalendarContainerResize = () => {
  if (typeof ResizeObserver === 'undefined' || !calendarContainerRef.value) return

  calendarResizeObserver?.disconnect()
  calendarResizeObserver = new ResizeObserver(() => {
    scheduleCalendarRefresh()
  })

  calendarResizeObserver.observe(calendarContainerRef.value)

  const splitShellRightPanel = calendarContainerRef.value.closest('.app-split-shell__right-content')
  if (splitShellRightPanel instanceof HTMLElement) {
    calendarResizeObserver.observe(splitShellRightPanel)
  }
}

const calendarOptions = computed(() => ({
  plugins: fullCalendarPlugins.value,
  initialView: 'dayGridMonth',
  locale: 'en-US',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  buttonText: {
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
  },
  height: '485px',
  editable: canMutate.value,
  selectable: canMutate.value,
  events: calendarEvents.value,
  dateClick: (info: { dateStr: string }) => {
    if (!canMutate.value) return
    const dayStart = new Date(`${info.dateStr}T09:00:00`).toISOString()
    const dayEnd = new Date(`${info.dateStr}T10:00:00`).toISOString()
    openCreateDialog(dayStart, dayEnd)
  },
  eventClick: (info: { event: { id: string } }) => {
    const event = events.value.find(item => item.id === info.event.id)
    if (event) openShowDialog(event)
  },
  eventDrop: (info: { event: { id: string, start?: Date | null, end?: Date | null } }) => {
    patchFromCalendarMove(info.event.id, info.event.start?.toISOString(), info.event.end?.toISOString())
  },
  eventResize: (info: { event: { id: string, start?: Date | null, end?: Date | null } }) => {
    patchFromCalendarMove(info.event.id, info.event.start?.toISOString(), info.event.end?.toISOString())
  },
}))

const items = computed(() => getCalendarNav())

onMounted(async () => {
  await Promise.all([
    loadEvents(),
    loadFullCalendar().then(({ FullCalendar, plugins }) => {
      FullCalendarComponent.value = FullCalendar
      fullCalendarPlugins.value = plugins
    }),
  ])

  await nextTick()
  observeCalendarContainerResize()
  scheduleCalendarRefresh()
})

onBeforeUnmount(() => {
  calendarResizeObserver?.disconnect()
})

watch(() => props.applicationSlug, loadEvents)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav :items="items" title="Calendar">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-subtitle-2">Calendar</span>
          <UiStatChip :value="filteredEvents.length" icon="mdi-calendar-clock-outline" class="calendar-icon" />
        </v-card-title>

        <v-card-text>
          <v-select
            v-model="selectedRange"
            :items="rangeOptions"
            label="Period"
            variant="outlined"
            hide-details
            density="compact"
            class="mt-3"
          />

          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Statut"
            variant="outlined"
            hide-details
            density="compact"
            class="mt-4"
          />

          <v-btn
            v-if="canMutate"
            prepend-icon="mdi-plus"
            block
            class="mt-4 create-event"
            @click="openCreateDialog"
          >
            {{ t('calendar.actions.createEvent') }}
          </v-btn>
        </v-card-text>
      </PlatformSidebarNav>
    </template>
    <template #aside>
      <div v-if="upcomingEventsByDay.length" class="d-flex flex-column ga-4">
        <div v-for="group in upcomingEventsByDay" :key="group.day">
          <p class="text-overline mb-1 text-medium-emphasis">{{ group.day }}</p>
          <v-list class="bg-transparent pa-0" lines="two">
            <v-list-item
                v-for="event in group.events"
                :key="event.id"
                class="calendar-page__item px-0 rounded-lg"
                :active="selectedEventId === event.id"
                @click="openShowDialog(event)"
            >
              <template #prepend>
                <v-avatar size="34" :color="statusToChipColor(event.status)" variant="tonal">
                  <v-icon icon="mdi-calendar-clock" size="18" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">{{ event.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatEventDate(event.startAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
      </div>

      <UiStateEmptyState
          v-else
          :title="t('calendar.empty.title')"
          :description="t('calendar.empty.description')"
          icon="mdi-calendar-blank-outline"
      />
    </template>

    <v-alert
      v-if="errorMessage"
      type="warning"
      variant="tonal"
      class="mb-3"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="isLoading" rounded="xl" class="mb-4 pa-4">
      <v-skeleton-loader type="heading" class="mb-2" />
      <v-skeleton-loader type="image" height="320" class="mb-3" />
      <v-skeleton-loader type="text@2" />
    </v-card>

    <div v-else class="calendar-page__slot" ref="calendarContainerRef">
      <v-skeleton-loader
        v-if="isCalendarLibLoading || !FullCalendarComponent"
        type="image"
        height="360"
      />
      <ClientOnly v-else>
        <component :is="FullCalendarComponent" ref="fullCalendarRef" :options="calendarOptions" />
      </ClientOnly>
    </div>

    <v-dialog v-model="isCreateDialogOpen" max-width="640">
      <v-card>
        <v-card-title>{{ t('calendar.actions.createEvent') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="eventForm.title"  :label="t('calendar.common.title')" class="mb-3" />
          <v-textarea v-model="eventForm.description"  :label="t('calendar.common.description')" rows="3" class="mb-3" />
          <v-text-field v-model="eventForm.startAt"  :label="t('calendar.common.start')" type="datetime-local" class="mb-3" />
          <v-text-field v-model="eventForm.endAt" :label="t('calendar.common.end')" type="datetime-local" class="mb-3" />
          <v-text-field v-model="eventForm.location"  :label="t('calendar.common.location')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isCreateDialogOpen = false">{{ t('calendar.actions.cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSaving" :disabled="!eventForm.title || !eventForm.startAt || !eventForm.endAt" @click="submitCreate">
            {{ t('calendar.actions.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isEditDialogOpen" max-width="640">
      <v-card>
        <v-card-title>{{ t('calendar.actions.editEvent') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="eventForm.title"  :label="t('calendar.common.title')" class="mb-3" />
          <v-textarea v-model="eventForm.description"  :label="t('calendar.common.description')" rows="3" class="mb-3" />
          <v-text-field v-model="eventForm.startAt"  :label="t('calendar.common.start')" type="datetime-local" class="mb-3" />
          <v-text-field v-model="eventForm.endAt" :label="t('calendar.common.end')" type="datetime-local" class="mb-3" />
          <v-text-field v-model="eventForm.location"  :label="t('calendar.common.location')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isEditDialogOpen = false">{{ t('calendar.actions.cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSaving" :disabled="!eventForm.title || !eventForm.startAt || !eventForm.endAt" @click="submitEdit">
            {{ t('calendar.actions.update') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isShowDialogOpen" max-width="640">
      <v-card v-if="selectedEvent">
        <v-card-title>{{ selectedEvent.title }}</v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-2">{{ selectedEvent.description || t('calendar.common.noDescription') }}</div>
          <v-chip size="small" variant="tonal" :color="statusToChipColor(selectedEvent.status)" class="mb-2">{{ statusLabel(selectedEvent.status) }}</v-chip>
          <div class="text-caption">{{ t('calendar.common.start') }}: {{ formatEventDate(selectedEvent.startAt) }}</div>
          <div class="text-caption">{{ t('calendar.common.end') }}: {{ formatEventDate(selectedEvent.endAt) }}</div>
          <div class="text-caption">{{ t('calendar.common.location') }}: {{ selectedEvent.location || t('calendar.common.notSpecified') }}</div>
          <div v-if="isDemoEvent(selectedEvent)" class="text-caption mt-2 text-info">
            {{ t('calendar.common.demoReadonly') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isShowDialogOpen = false">{{ t('calendar.actions.close') }}</v-btn>
          <v-btn v-if="canMutate && !isDemoEvent(selectedEvent)" color="primary" variant="text" @click="openEditDialog(selectedEvent)">{{ t('calendar.actions.edit') }}</v-btn>
          <v-btn v-if="canMutate && !isDemoEvent(selectedEvent)" color="warning" variant="text" @click="cancelEvent(selectedEvent)">{{ t('calendar.actions.cancel') }}</v-btn>
          <v-btn v-if="canMutate && !isDemoEvent(selectedEvent)" color="error" variant="text" @click="deleteEvent(selectedEvent)">{{ t('calendar.actions.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformSplitLayout>
</template>

<style scoped>
.calendar-icon {
  background-color: rgba(var(--v-theme-primary), 0.26);
}

.create-event {
  background-color: rgba(var(--v-theme-primary), 0.26);
}

.calendar-page__hero {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.calendar-page__board {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.calendar-page__item {
  transition: background-color 0.2s ease;
}

.calendar-page__item:hover,
.calendar-page__item:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.calendar-page__slot {
  min-height: 320px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  padding: 1rem;
}

:deep(.fc .fc-toolbar.fc-header-toolbar) {
  margin-bottom: 1rem;
}

:deep(.fc .fc-button-primary) {
  background-color: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

:deep(.fc .fc-daygrid-dot-event),
:deep(.fc .fc-daygrid-dot-event:hover),
:deep(.fc .fc-daygrid-dot-event:focus-visible) {
  transform: none !important;
  margin: 0;
}

:deep(.fc .fc-daygrid-dot-event .fc-event-time),
:deep(.fc .fc-daygrid-dot-event .fc-event-title) {
  line-height: 1.25;
}
</style>
