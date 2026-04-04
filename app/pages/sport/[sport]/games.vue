<script setup lang="ts">
import { computed } from 'vue'
import { getSportContext } from '~/components/sport/sportContext'
import type { SportGameCardItem } from '~/components/sport/types'

definePageMeta({
  public: true,
  requiresAuth: false,
})

type SportGamesTodayResponse = {
  sport: string
  date: string
  timezonePolicy: string
  games: SportGameCardItem[]
}

const route = useRoute()
const { t, te } = useI18n()

const sportSlug = computed(() => String(route.params.sport ?? 'sport'))
const sport = computed(() => getSportContext(sportSlug.value, t, te))
const timezone = computed(() => {
  const value = typeof route.query.timezone === 'string' ? route.query.timezone.trim() : ''
  return value || 'UTC'
})

const {
  data,
  pending,
  error,
  refresh,
} = await useAsyncData(
  () => `sport-games-today-${sportSlug.value}-${timezone.value}`,
  () => $fetch<SportGamesTodayResponse>(`/api/sport/${sportSlug.value}/games/today`, {
    query: {
      timezone: timezone.value,
    },
  }),
  {
    server: true,
    default: () => ({
      sport: sportSlug.value,
      date: '',
      timezonePolicy: 'UTC',
      games: [],
    }),
  },
)

const games = computed(() => data.value?.games || [])
</script>

<template>
  <UiPageShell :title="sport.label" :description="t('app.navigation.sport')">
    <div class="d-flex flex-column ga-4 ga-md-6">
      <SportHeaderCard
        :sport-name="sport.label"
        :sport-icon="sport.icon"
        :metrics="sport.metrics"
      />

      <SportSegmentedNav
        :sport-slug="sport.slug"
        active-section="games"
      />

      <v-card variant="tonal" class="pa-4 pa-md-5">
        <div class="d-flex flex-wrap justify-space-between align-center ga-2 mb-4">
          <p class="text-body-1 mb-0">
            Matchs du jour — {{ data?.date || '----/--/--' }}
          </p>
          <v-chip size="small" variant="outlined">
            Timezone: {{ data?.timezonePolicy || 'UTC' }}
          </v-chip>
        </div>

        <UiLoadingState
          v-if="pending"
          variant="cards"
          :cards="3"
          message="Chargement des matchs du jour..."
        />

        <template v-else-if="error">
          <UiStateAlert type="error" class="mb-4">
            Impossible de charger les matchs du jour.
          </UiStateAlert>
          <v-btn color="primary" variant="flat" @click="refresh()">
            Réessayer
          </v-btn>
        </template>

        <UiEmptyState
          v-else-if="games.length === 0"
          title="Aucun match prévu aujourd'hui"
          description="Aucun événement n'a été remonté pour cette date."
          icon="mdi-calendar-blank-outline"
        >
          <template #action>
            <v-btn color="primary" variant="flat" @click="refresh()">
              Actualiser
            </v-btn>
          </template>
        </UiEmptyState>

        <SportGamesList v-else :games="games" />
      </v-card>
    </div>
  </UiPageShell>
</template>
