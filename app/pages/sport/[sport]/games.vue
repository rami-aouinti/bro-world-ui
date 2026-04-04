<script setup lang="ts">
import { computed, watch } from 'vue'
import { getSportContext } from '~/components/sport/sportContext'
import type { SportGameCardItem } from '~/components/sport/types'
import { useSportGamesDashboard } from '~/components/sport/useSportGamesDashboard'

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

const dashboard = useSportGamesDashboard({
  sport: sportSlug,
  games,
})

watch(() => data.value?.date, (dateValue) => {
  if (dateValue && !dashboard.date.value) {
    dashboard.date.value = dateValue
  }
}, { immediate: true })
</script>

<template>
  <UiPageShell :title="sport.label" :description="t('app.navigation.sport')">
    <div class="d-flex flex-column ga-4 ga-md-6">
      <SportSegmentedNav
        :sport-slug="sport.slug"
        active-section="games"
      />

      <div class="sport-dashboard">
        <aside class="sport-dashboard__left">
          <SportLeaguesList
            :leagues="dashboard.availableLeagues"
            :selected-league="dashboard.league"
            :selected-status="dashboard.status"
            :selected-date="dashboard.date"
            :search="dashboard.search"
            @update:selected-league="dashboard.league = $event"
            @update:selected-status="dashboard.status = $event"
            @update:selected-date="dashboard.date = $event"
            @update:search="dashboard.search = $event"
          />
        </aside>

        <main class="sport-dashboard__center">
          <v-card variant="tonal" class="pa-4">
            <div class="d-flex flex-wrap justify-space-between align-center ga-2 mb-4">
              <p class="text-body-1 mb-0">
                {{ t('sport.todayGames') }} — {{ data?.date || '----/--/--' }}
              </p>
              <v-chip size="small" variant="outlined">
                {{ t('sport.timezone') }}: {{ data?.timezonePolicy || 'UTC' }}
              </v-chip>
            </div>

            <UiLoadingState
              v-if="pending"
              variant="cards"
              :cards="3"
              :message="t('sport.loadingGames')"
            />

            <template v-else-if="error">
              <UiStateAlert type="error" class="mb-4">
                {{ t('sport.unableToLoadGames') }}
              </UiStateAlert>
              <v-btn color="primary" variant="flat" @click="refresh()">
                {{ t('sport.retry') }}
              </v-btn>
            </template>

            <UiEmptyState
              v-else-if="dashboard.filteredGames.length === 0"
              :title="t('sport.noGamesToday')"
              :description="t('sport.noGamesTodayDescription')"
              icon="mdi-calendar-blank-outline"
            >
              <template #action>
                <v-btn color="primary" variant="flat" @click="refresh()">
                  {{ t('sport.retry') }}
                </v-btn>
              </template>
            </UiEmptyState>

            <SportGamesList
              v-else
              :games="dashboard.filteredGames"
              :selected-game-id="dashboard.selectedGameId"
              @select="dashboard.setSelectedGame"
              @select-team="dashboard.setSelectedTeam"
            />
          </v-card>
        </main>

        <aside class="sport-dashboard__right">
          <v-tabs
            v-model="dashboard.rightPanelTab"
            density="compact"
            color="primary"
            class="mb-3"
          >
            <v-tab value="game">Game</v-tab>
            <v-tab value="team">Team</v-tab>
            <v-tab value="standings">Standings</v-tab>
          </v-tabs>

          <SportGameDetailsPanel
            v-if="dashboard.rightPanelTab === 'game'"
            :game="dashboard.selectedGame"
          />
          <SportTeamPanel
            v-else-if="dashboard.rightPanelTab === 'team'"
            :game="dashboard.selectedGame"
            :team-id="dashboard.selectedTeamId"
          />
          <SportStandingsPanel
            v-else
            :games="dashboard.filteredGames"
          />
        </aside>
      </div>
    </div>
  </UiPageShell>
</template>

<style scoped>
.sport-dashboard {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(260px, 340px);
  align-items: start;
}

.sport-dashboard__left,
.sport-dashboard__right {
  position: sticky;
  top: 16px;
}

@media (max-width: 960px) {
  .sport-dashboard {
    grid-template-columns: 1fr;
  }

  .sport-dashboard__left,
  .sport-dashboard__right {
    position: static;
  }

  .sport-dashboard__left {
    order: 2;
  }

  .sport-dashboard__center {
    order: 1;
  }

  .sport-dashboard__right {
    order: 3;
  }
}
</style>
