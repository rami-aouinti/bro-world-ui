<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'

type CalendarEvent = {
  id: number
  title: string
  date: string
  type: 'meeting' | 'release' | 'task'
  color: string
}

type CalendarFilterRange = '7days' | '30days' | 'quarter'

type FullCalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  color: string
  extendedProps: {
    type: CalendarEvent['type']
  }
}

const selectedRange = ref<CalendarFilterRange>('7days')
const selectedType = ref<'all' | CalendarEvent['type']>('all')

const rangeOptions = [
  { title: '7 prochains jours', value: '7days' },
  { title: '30 prochains jours', value: '30days' },
  { title: 'Ce trimestre', value: 'quarter' },
]

const typeOptions = [
  { title: 'Tous les événements', value: 'all' },
  { title: 'Réunions', value: 'meeting' },
  { title: 'Lancements', value: 'release' },
  { title: 'Tâches', value: 'task' },
]

const upcomingEvents = ref<CalendarEvent[]>([
  { id: 1, title: 'Kickoff produit Q3', date: 'Mardi 09:30', type: 'meeting', color: 'primary' },
  { id: 2, title: 'Déploiement v2.8', date: 'Jeudi 14:00', type: 'release', color: 'success' },
  { id: 3, title: 'Atelier design system', date: 'Vendredi 11:00', type: 'task', color: 'info' },
])

const calendarEvents = ref<FullCalendarEvent[]>([
  {
    id: 'evt-1',
    title: 'Kickoff produit Q3',
    start: '2026-03-10T09:30:00',
    end: '2026-03-10T10:30:00',
    color: '#1976D2',
    extendedProps: { type: 'meeting' },
  },
  {
    id: 'evt-2',
    title: 'Déploiement v2.8',
    start: '2026-03-12T14:00:00',
    end: '2026-03-12T15:00:00',
    color: '#2E7D32',
    extendedProps: { type: 'release' },
  },
  {
    id: 'evt-3',
    title: 'Atelier design system',
    start: '2026-03-13T11:00:00',
    end: '2026-03-13T12:00:00',
    color: '#0288D1',
    extendedProps: { type: 'task' },
  },
  {
    id: 'evt-4',
    title: 'Sprint planning',
    start: '2026-03-18T10:00:00',
    end: '2026-03-18T11:30:00',
    color: '#5E35B1',
    extendedProps: { type: 'meeting' },
  },
  {
    id: 'evt-5',
    title: 'Release candidate QA',
    start: '2026-04-01T13:30:00',
    end: '2026-04-01T15:00:00',
    color: '#00897B',
    extendedProps: { type: 'release' },
  },
])

const filteredEvents = computed(() => {
  if (selectedType.value === 'all') {
    return upcomingEvents.value
  }

  return upcomingEvents.value.filter(event => event.type === selectedType.value)
})

const rangeInDays: Record<CalendarFilterRange, number> = {
  '7days': 7,
  '30days': 30,
  'quarter': 90,
}

const filteredCalendarEvents = computed(() => {
  const windowDays = rangeInDays[selectedRange.value]
  const startDate = new Date('2026-03-01T00:00:00')
  const maxDate = new Date(startDate)
  maxDate.setDate(startDate.getDate() + windowDays)

  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    const matchesType = selectedType.value === 'all' || event.extendedProps.type === selectedType.value
    const inRange = eventDate >= startDate && eventDate <= maxDate

    return matchesType && inRange
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
  editable: true,
  selectable: true,
  events: filteredCalendarEvents.value,
}))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Planification"
        subtitle="Ajustez les filtres avant d'afficher les événements."
      />

      <v-select
        v-model="selectedRange"
        :items="rangeOptions"
        label="Période"
        variant="outlined"
        hide-details
        density="comfortable"
        class="mb-3"
      />

      <v-select
        v-model="selectedType"
        :items="typeOptions"
        label="Type"
        variant="outlined"
        hide-details
        density="comfortable"
      />

      <div class="platform-layout__sidebar-actions mt-4">
        <v-btn color="primary" prepend-icon="mdi-plus" block>Créer un événement</v-btn>
      </div>
    </template>

    <template #default>
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Prochains événements</h2>
        <UiStatChip :value="filteredEvents.length" icon="mdi-calendar-clock-outline" color="info" />
      </div>

      <v-list v-if="filteredEvents.length" class="bg-transparent pa-0" lines="two">
        <v-list-item
          v-for="event in filteredEvents"
          :key="event.id"
          class="calendar-page__item px-0 rounded-lg"
        >
          <template #prepend>
            <v-avatar size="34" :color="event.color" variant="tonal">
              <v-icon icon="mdi-calendar-clock" size="18" />
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">{{ event.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ event.date }}</v-list-item-subtitle>

          <template #append>
            <v-chip size="small" variant="tonal" :color="event.color">{{ event.type }}</v-chip>
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
          <v-btn color="primary" prepend-icon="mdi-plus">Planifier maintenant</v-btn>
        </template>
      </UiStateEmptyState>

      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Vue calendrier</h2>
        <UiStatChip :value="`${filteredCalendarEvents.length} événements`" color="info" />
      </div>

      <div class="calendar-page__slot">
        <ClientOnly>
          <FullCalendar :options="calendarOptions" />
        </ClientOnly>
      </div>
    </template>
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
</style>
