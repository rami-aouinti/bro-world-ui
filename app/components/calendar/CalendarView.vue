<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import { useCalendarEventsApi } from '~/composables/api/useCalendarEventsApi'
import type {
  CalendarEventRead,
  CreateCalendarEventPayload,
  EventStatus,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import PlatformSidebarNav from "~/components/platform/PlatformSidebarNav.vue";
import type {PlatformNavItem} from "~/data/platform-nav";
import {getCalendarNav} from "~/data/platform-nav";

const props = withDefaults(defineProps<{
  applicationSlug?: string
}>(), {
  applicationSlug: undefined,
})

const { isAuthenticated } = useAuth()
const calendarApi = useCalendarEventsApi()

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

const events = ref<CalendarEventRead[]>([])
const selectedRange = ref<'7days' | '30days' | 'quarter'>('30days')
const selectedStatus = ref<'all' | EventStatus>('all')
const selectedEventId = ref<string | null>(null)

const isCreateDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isShowDialogOpen = ref(false)
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

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
  { title: '7 prochains jours', value: '7days' },
  { title: '30 prochains jours', value: '30days' },
  { title: 'Ce trimestre', value: 'quarter' },
]

const statusOptions = [
  { title: 'Tous les statuts', value: 'all' },
  { title: 'Confirmé', value: 'confirmed' },
  { title: 'Tentative', value: 'tentative' },
  { title: 'Annulé', value: 'cancelled' },
]

const rangeInDays = { '7days': 7, '30days': 30, 'quarter': 90 }

const toDateTimeLocalValue = (isoDate: string) => {
  const date = new Date(isoDate)
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60_000))
  return localDate.toISOString().slice(0, 16)
}

const formatEventDate = (isoDate: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

const statusToChipColor = (status: EventStatus) => {
  if (status === 'confirmed') return 'success'
  if (status === 'tentative') return 'warning'
  return 'error'
}

const statusLabel = (status: EventStatus) => {
  if (status === 'confirmed') return 'confirmé'
  if (status === 'tentative') return 'tentative'
  return 'annulé'
}

const fullCalendarColorByStatus: Record<EventStatus, string> = {
  confirmed: '#2E7D32',
  tentative: '#ED6C02',
  cancelled: '#D32F2F',
}

const loadEvents = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    events.value = await calendarApi.list(props.applicationSlug, usePrivateList.value)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger les événements du calendrier.'
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
    await calendarApi.create(buildPayload(), props.applicationSlug)
    isCreateDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de créer cet événement.'
  } finally {
    isSaving.value = false
  }
}

const submitEdit = async () => {
  if (!selectedEventId.value || !canMutate.value) return

  try {
    isSaving.value = true
    const payload: PatchCalendarEventPayload = buildPayload()
    await calendarApi.patch(selectedEventId.value, payload, props.applicationSlug)
    isEditDialogOpen.value = false
    isShowDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de modifier cet événement.'
  } finally {
    isSaving.value = false
  }
}

const cancelEvent = async (event: CalendarEventRead) => {
  if (!canMutate.value) return

  try {
    isSaving.value = true
    await calendarApi.cancel(event.id, props.applicationSlug)
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible d\'annuler cet événement.'
  } finally {
    isSaving.value = false
  }
}

const deleteEvent = async (event: CalendarEventRead) => {
  if (!canMutate.value) return

  try {
    isSaving.value = true
    await calendarApi.delete(event.id, props.applicationSlug)
    if (selectedEventId.value === event.id) selectedEventId.value = null
    isShowDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de supprimer cet événement.'
  } finally {
    isSaving.value = false
  }
}

const patchFromCalendarMove = async (eventId: string, startAt?: string, endAt?: string) => {
  if (!canMutate.value || !startAt) return

  try {
    isSaving.value = true
    await calendarApi.patch(eventId, {
      startAt,
      endAt: endAt || startAt,
    }, props.applicationSlug)
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de déplacer ou redimensionner cet événement.'
  } finally {
    isSaving.value = false
  }
}

const refreshCalendarGeometry = () => {
  fullCalendarRef.value?.getApi().updateSize()
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'fr',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  buttonText: {
    today: 'Aujourd\'hui',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
  },
  height: 'auto',
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
  await loadEvents()

  await nextTick()
  requestAnimationFrame(refreshCalendarGeometry)

  // Le shell applique une animation d'entrée avec transform: translateY.
  // On force un recalcul juste après l'animation pour éviter un décalage souris/grille.
  setTimeout(refreshCalendarGeometry, 320)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshCalendarGeometry)
})

onMounted(() => {
  window.addEventListener('resize', refreshCalendarGeometry)
})

watch(() => props.applicationSlug, loadEvents)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav :items="items" title="Calendar">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-subtitle-2">Prochains événements</span>
          <UiStatChip :value="filteredEvents.length" icon="mdi-calendar-clock-outline" color="info" />
        </v-card-title>
        <v-card-text>
          <v-select
              v-model="selectedRange"
              :items="rangeOptions"
              label="Période"
              variant="outlined"
              hide-details
              density="compact"
              class="mb-3"
          />

          <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="Statut"
              variant="outlined"
              hide-details
              density="compact"
              class="mb-4"
          />

          <v-btn
              v-if="canMutate"
              color="primary"
              prepend-icon="mdi-plus"
              block
              class="mb-4"
              @click="openCreateDialog"
          >
            Créer un événement
          </v-btn>

          <v-list v-if="filteredEvents.length" class="bg-transparent pa-0" lines="two">
            <v-list-item
                v-for="event in filteredEvents"
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

          <UiStateEmptyState
              v-else
              title="Aucun événement à venir"
              description="Commencez par créer un événement pour alimenter votre planning."
              icon="mdi-calendar-blank-outline"
          />
        </v-card-text>
      </PlatformSidebarNav>
    </template>
  <v-alert
    v-if="errorMessage"
    type="error"
    variant="tonal"
    class="mb-3"
    closable
    @click:close="errorMessage = ''"
  >
    {{ errorMessage }}
  </v-alert>

    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

    <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
      <span class="text-subtitle-1 font-weight-bold">Vue calendrier</span>
      <UiStatChip :value="`${calendarEvents.length} événements`" color="info" />
    </v-card-title>
    <v-card-text>
      <div class="calendar-page__slot">
        <ClientOnly>
          <FullCalendar ref="fullCalendarRef" :options="calendarOptions" />
        </ClientOnly>
      </div>
    </v-card-text>

  <v-dialog v-model="isCreateDialogOpen" max-width="640">
    <v-card>
      <v-card-title>Créer un événement</v-card-title>
      <v-card-text>
        <v-text-field v-model="eventForm.title" label="Titre" class="mb-3" />
        <v-textarea v-model="eventForm.description" label="Description" rows="3" class="mb-3" />
        <v-text-field v-model="eventForm.startAt" label="Début" type="datetime-local" class="mb-3" />
        <v-text-field v-model="eventForm.endAt" label="Fin" type="datetime-local" class="mb-3" />
        <v-text-field v-model="eventForm.location" label="Lieu" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isCreateDialogOpen = false">Annuler</v-btn>
        <v-btn color="primary" :loading="isSaving" :disabled="!eventForm.title || !eventForm.startAt || !eventForm.endAt" @click="submitCreate">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="isEditDialogOpen" max-width="640">
    <v-card>
      <v-card-title>Modifier l'événement</v-card-title>
      <v-card-text>
        <v-text-field v-model="eventForm.title" label="Titre" class="mb-3" />
        <v-textarea v-model="eventForm.description" label="Description" rows="3" class="mb-3" />
        <v-text-field v-model="eventForm.startAt" label="Début" type="datetime-local" class="mb-3" />
        <v-text-field v-model="eventForm.endAt" label="Fin" type="datetime-local" class="mb-3" />
        <v-text-field v-model="eventForm.location" label="Lieu" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isEditDialogOpen = false">Annuler</v-btn>
        <v-btn color="primary" :loading="isSaving" :disabled="!eventForm.title || !eventForm.startAt || !eventForm.endAt" @click="submitEdit">
          Mettre à jour
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="isShowDialogOpen" max-width="640">
    <v-card v-if="selectedEvent">
      <v-card-title>{{ selectedEvent.title }}</v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-2">{{ selectedEvent.description || 'Sans description' }}</div>
        <v-chip size="small" variant="tonal" :color="statusToChipColor(selectedEvent.status)" class="mb-2">{{ statusLabel(selectedEvent.status) }}</v-chip>
        <div class="text-caption">Début: {{ formatEventDate(selectedEvent.startAt) }}</div>
        <div class="text-caption">Fin: {{ formatEventDate(selectedEvent.endAt) }}</div>
        <div class="text-caption">Lieu: {{ selectedEvent.location || 'Non renseigné' }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isShowDialogOpen = false">Fermer</v-btn>
        <v-btn v-if="canMutate" color="primary" variant="text" @click="openEditDialog(selectedEvent)">Modifier</v-btn>
        <v-btn v-if="canMutate" color="warning" variant="text" @click="cancelEvent(selectedEvent)">Annuler</v-btn>
        <v-btn v-if="canMutate" color="error" variant="text" @click="deleteEvent(selectedEvent)">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </PlatformSplitLayout>
</template>

<style scoped>
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
