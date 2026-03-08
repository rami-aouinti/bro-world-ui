<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import { useCalendarEventsApi } from '~/composables/api/useCalendarEventsApi'
import type {
  CalendarEventRead,
  CreateCalendarEventPayload,
  EventStatus,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'

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

const rangeInDays = {
  '7days': 7,
  '30days': 30,
  'quarter': 90,
}

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
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'tentative':
      return 'warning'
    case 'cancelled':
      return 'error'
  }
}

const statusLabel = (status: EventStatus) => {
  switch (status) {
    case 'confirmed':
      return 'confirmé'
    case 'tentative':
      return 'tentative'
    case 'cancelled':
      return 'annulé'
  }
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
    events.value = await calendarApi.list()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger les événements du calendrier.'
  } finally {
    isLoading.value = false
  }
}

const statusFilteredEvents = computed(() => {
  return events.value.filter((event) => {
    return selectedStatus.value === 'all' || event.status === selectedStatus.value
  })
})

const filteredEvents = computed(() => {
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  const maxDate = new Date(startDate)
  maxDate.setDate(startDate.getDate() + rangeInDays[selectedRange.value])

  return [...statusFilteredEvents.value]
    .filter(event => {
      const eventStart = new Date(event.startAt)
      const inRange = eventStart >= startDate && eventStart <= maxDate

      return inRange
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
  editable: false,
  selectable: false,
  events: calendarEvents.value,
  eventClick: (info: { event: { id: string } }) => {
    selectedEventId.value = info.event.id
  },
}))

const resetForm = () => {
  eventForm.title = ''
  eventForm.description = ''
  eventForm.startAt = ''
  eventForm.endAt = ''
  eventForm.location = ''
}

const openCreateDialog = () => {
  resetForm()
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

const buildPayload = (): CreateCalendarEventPayload => ({
  title: eventForm.title,
  description: eventForm.description,
  startAt: new Date(eventForm.startAt).toISOString(),
  endAt: new Date(eventForm.endAt).toISOString(),
  location: eventForm.location,
})

const submitCreate = async () => {
  try {
    isSaving.value = true
    await calendarApi.create(buildPayload())
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
  if (!selectedEventId.value) {
    return
  }

  try {
    isSaving.value = true
    const payload: PatchCalendarEventPayload = buildPayload()
    await calendarApi.patch(selectedEventId.value, payload)
    isEditDialogOpen.value = false
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de modifier cet événement.'
  } finally {
    isSaving.value = false
  }
}

const cancelEvent = async (event: CalendarEventRead) => {
  try {
    isSaving.value = true
    await calendarApi.cancel(event.id)
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible d\'annuler cet événement.'
  } finally {
    isSaving.value = false
  }
}

const deleteEvent = async (event: CalendarEventRead) => {
  try {
    isSaving.value = true
    await calendarApi.delete(event.id)
    if (selectedEventId.value === event.id) {
      selectedEventId.value = null
    }
    await loadEvents()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de supprimer cet événement.'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadEvents)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Planification"
        subtitle="Gérez vos événements privés avec les nouveaux endpoints CRUD."
      />

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
      />

      <div class="platform-layout__sidebar-actions mt-4">
        <v-btn color="primary" prepend-icon="mdi-plus" block @click="openCreateDialog">Créer un événement</v-btn>
      </div>
    </template>

    <template #default>
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

      <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Prochains événements</h2>
        <UiStatChip :value="filteredEvents.length" icon="mdi-calendar-clock-outline" color="info" />
      </div>

      <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

      <v-list v-if="filteredEvents.length" class="bg-transparent pa-0" lines="two">
        <v-list-item
          v-for="event in filteredEvents"
          :key="event.id"
          class="calendar-page__item px-0 rounded-lg"
          :active="selectedEventId === event.id"
          @click="selectedEventId = event.id"
        >
          <template #prepend>
            <v-avatar size="34" :color="statusToChipColor(event.status)" variant="tonal">
              <v-icon icon="mdi-calendar-clock" size="18" />
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">{{ event.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatEventDate(event.startAt) }}</v-list-item-subtitle>

          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip size="small" variant="tonal" :color="statusToChipColor(event.status)">{{ statusLabel(event.status) }}</v-chip>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" size="x-small" variant="text" />
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-pencil" title="Modifier" @click="openEditDialog(event)" />
                  <v-list-item prepend-icon="mdi-cancel" title="Annuler" @click="cancelEvent(event)" />
                  <v-list-item prepend-icon="mdi-delete" title="Supprimer" @click="deleteEvent(event)" />
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-list-item>
      </v-list>

      <UiStateEmptyState
        v-else
        title="Aucun événement à venir"
        description="Commencez par créer un événement pour alimenter votre planning."
        icon="mdi-calendar-blank-outline"
      >
        <template #action>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Planifier maintenant</v-btn>
        </template>
      </UiStateEmptyState>

      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Vue calendrier</h2>
        <UiStatChip :value="`${calendarEvents.length} événements`" color="info" />
      </div>

      <div class="calendar-page__slot">
        <ClientOnly>
          <FullCalendar :options="calendarOptions" />
        </ClientOnly>
      </div>

      <v-card v-if="selectedEvent" class="mt-4" variant="outlined">
        <v-card-title>{{ selectedEvent.title }}</v-card-title>
        <v-card-text>
          <div class="text-body-2">{{ selectedEvent.description || 'Sans description' }}</div>
          <div class="text-caption mt-2">Début: {{ formatEventDate(selectedEvent.startAt) }}</div>
          <div class="text-caption">Fin: {{ formatEventDate(selectedEvent.endAt) }}</div>
          <div class="text-caption">Lieu: {{ selectedEvent.location || 'Non renseigné' }}</div>
        </v-card-text>
      </v-card>
    </template>
  </PlatformSplitLayout>

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
</style>
