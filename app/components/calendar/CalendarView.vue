<script setup lang="ts">
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

const selectedRange = ref('7days')
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

const filteredEvents = computed(() => {
  if (selectedType.value === 'all') {
    return upcomingEvents.value
  }

  return upcomingEvents.value.filter(event => event.type === selectedType.value)
})
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
        <UiStatChip value="Slot prêt pour FullCalendar" color="info" />
      </div>

      <div class="calendar-page__slot d-flex flex-column align-center justify-center text-medium-emphasis">
        <v-icon icon="mdi-calendar-range" size="40" class="mb-2" />
        <p class="text-body-2 mb-3 text-center">Intégrez ici le composant FullCalendar avec vos sources d'événements.</p>
        <v-btn variant="outlined" prepend-icon="mdi-code-tags">Configurer le calendrier</v-btn>
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
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 16px;
  padding: 1.25rem;
}
</style>
