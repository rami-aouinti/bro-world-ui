<script setup lang="ts">
import UiListCard from '~/components/ui/UiListCard.vue'
import UiPageShell from '~/components/ui/page/UiPageShell.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const selectedRange = ref('7days')
const selectedType = ref('all')

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

const upcomingEvents = [
  { id: 1, title: 'Kickoff produit Q3', date: 'Mardi 09:30', type: 'meeting', color: 'primary' },
  { id: 2, title: 'Déploiement v2.8', date: 'Jeudi 14:00', type: 'release', color: 'success' },
  { id: 3, title: 'Atelier design system', date: 'Vendredi 11:00', type: 'task', color: 'info' },
]
</script>

<template>
  <UiPageShell
    title="Calendar"
    eyebrow="Planification"
    icon="mdi-calendar-month-outline"
    subtitle="Visualisez les échéances à venir et préparez vos prochaines actions d'équipe."
    max-width="1200"
  >
    <template #actions>
      <v-btn color="primary" prepend-icon="mdi-plus" class="w-100 w-md-auto">Créer un événement</v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="4">
        <UiListCard>
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Filtres</h2>
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
        </UiListCard>
      </v-col>

      <v-col cols="12" md="8">
        <UiListCard>
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Prochains événements</h2>
            <UiStatChip :value="upcomingEvents.length" icon="mdi-calendar-clock-outline" color="info" />
          </div>

          <v-list v-if="upcomingEvents.length" class="bg-transparent pa-0" lines="two">
            <v-list-item
              v-for="event in upcomingEvents"
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
        </UiListCard>
      </v-col>
    </v-row>

    <UiListCard>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Vue calendrier</h2>
        <UiStatChip value="Slot prêt pour FullCalendar" color="info" />
      </div>

      <div class="calendar-page__slot d-flex flex-column align-center justify-center text-medium-emphasis">
        <v-icon icon="mdi-calendar-range" size="40" class="mb-2" />
        <p class="text-body-2 mb-3 text-center">Intégrez ici le composant FullCalendar avec vos sources d'événements.</p>
        <v-btn variant="outlined" prepend-icon="mdi-code-tags">Configurer le calendrier</v-btn>
      </div>
    </UiListCard>
  </UiPageShell>
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
