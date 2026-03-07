<script setup lang="ts">
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
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
  <UiPageSection max-width="1200">
    <v-card class="pa-6 pa-md-8 mb-6 rounded-xl elevation-2">
      <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
        <div>
          <p class="text-overline text-primary mb-2">Planification</p>
          <h1 class="text-h4 font-weight-bold mb-2 d-flex align-center ga-2">
            <v-icon icon="mdi-calendar-month-outline" color="primary" />
            Calendar
          </h1>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Visualisez les échéances à venir et préparez vos prochaines actions d'équipe.
          </p>
        </div>

        <v-btn color="primary" prepend-icon="mdi-plus">Créer un événement</v-btn>
      </div>
    </v-card>

    <v-row class="mb-2">
      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl elevation-1 h-100">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Filtres</h2>
          <v-select
            v-model="selectedRange"
            :items="rangeOptions"
            label="Période"
            variant="outlined"
            hide-details
            class="mb-3"
          />
          <v-select
            v-model="selectedType"
            :items="typeOptions"
            label="Type"
            variant="outlined"
            hide-details
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="pa-4 rounded-xl elevation-1 h-100">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Prochains événements</h2>
          <v-list v-if="upcomingEvents.length" class="bg-transparent pa-0" lines="two">
            <v-list-item
              v-for="event in upcomingEvents"
              :key="event.id"
              class="px-0"
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
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-5 pa-md-6 rounded-xl elevation-1">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <h2 class="text-h6 mb-0">Vue calendrier</h2>
        <v-chip size="small" color="info" variant="tonal">Slot prêt pour FullCalendar</v-chip>
      </div>

      <div class="calendar-page__slot d-flex flex-column align-center justify-center text-medium-emphasis">
        <v-icon icon="mdi-calendar-range" size="40" class="mb-2" />
        <p class="text-body-2 mb-3 text-center">Intégrez ici le composant FullCalendar avec vos sources d'événements.</p>
        <v-btn variant="outlined" prepend-icon="mdi-code-tags">Configurer le calendrier</v-btn>
      </div>
    </v-card>
  </UiPageSection>
</template>

<style scoped>
.calendar-page__slot {
  min-height: 320px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 16px;
  padding: 1.5rem;
}
</style>
