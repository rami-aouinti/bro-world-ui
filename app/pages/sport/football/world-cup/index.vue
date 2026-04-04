<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { MatchEvent, MatchLineup, MatchPlayersByTeam, MatchStatisticTeam } from '~/components/football/types'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})

type GenericRecord = Record<string, any>

const WORLD_CUP_LEAGUE_ID = 1
const fallbackSeason = 2022

const { locale } = useI18n()
const { smAndDown } = useDisplay()

const worldCupStore = useFifaWorldCupStore()
const fixturesStore = useFifaFixturesStore()
const standingsStore = useFifaStandingsStore()
const playersStore = useFifaPlayersStore()
const oddsStore = useFifaOddsStore()
const referenceStore = useFifaReferenceStore()
const predictionsStore = useFifaPredictionsStore()

const { teams } = storeToRefs(worldCupStore)
const { byResource: fixturesByResource, loading: fixturesLoading, error: fixturesError } = storeToRefs(fixturesStore)
const { standings, loading: standingsLoading, error: standingsError } = storeToRefs(standingsStore)
const { byResource: playersByResource, loading: playersLoading, error: playersError } = storeToRefs(playersStore)
const { byResource: oddsByResource, loading: oddsLoading, error: oddsError } = storeToRefs(oddsStore)
const { seasons, loading: referenceLoading, error: referenceError } = storeToRefs(referenceStore)
const { predictions, loading: predictionsLoading, error: predictionsError } = storeToRefs(predictionsStore)

const tableDensity = computed(() => (smAndDown.value ? 'comfortable' : 'compact'))
const sectionChipSize = computed(() => (smAndDown.value ? 'x-small' : 'small'))

const selectedSeason = ref<number>(fallbackSeason)
const fixtureFilters = reactive({
  date: '',
  status: '',
  team: null as number | null,
  group: 'all',
})

const selectedFixtureId = ref<number | null>(null)
const selectedTeam = ref<{ id: number, name: string, logo: string, group: string } | null>(null)

const playersPage = ref(1)
const playersMeta = ref({ current: 1, total: 1 })

const oddsPage = ref(1)
const oddsMeta = ref({ current: 1, total: 1 })

const showOddsAndPredictions = ref(false)

const isQuotaError = (err: unknown) => {
  const candidate = err as GenericRecord | null
  return candidate?.data?.error?.code === 'FIFA_PROXY_API_SPORTS_RATE_LIMITED' || candidate?.statusCode === 503
}

const quotaMessage = 'Limite de quota API atteinte. Réessayez plus tard ou réduisez le volume de requêtes.'

const groupedTeams = computed(() => {
  return teams.value.reduce<Record<string, typeof teams.value>>((acc, team) => {
    const key = team.group || 'Sans groupe'
    acc[key] = acc[key] || []
    acc[key].push(team)
    return acc
  }, {})
})

const groupOptions = computed(() => ['all', ...Object.keys(groupedTeams.value)])

const teamOptions = computed(() => {
  const fixtureItems = fixturesByResource.value.fixtures as GenericRecord[]
  const seen = new Map<number, string>()

  for (const item of fixtureItems) {
    const home = item?.teams?.home
    const away = item?.teams?.away

    if (home?.id && home?.name) {
      seen.set(Number(home.id), String(home.name))
    }
    if (away?.id && away?.name) {
      seen.set(Number(away.id), String(away.name))
    }
  }

  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
})

const matchDetails = computed(() => ({
  events: fixturesByResource.value.events as MatchEvent[],
  lineups: fixturesByResource.value.lineups as MatchLineup[],
  statistics: fixturesByResource.value.statistics as MatchStatisticTeam[],
  players: fixturesByResource.value.players as MatchPlayersByTeam[],
}))

const fixturesList = computed(() => {
  const fixtureItems = fixturesByResource.value.fixtures as GenericRecord[]
  const selectedGroupTeams = fixtureFilters.group !== 'all'
    ? new Set((groupedTeams.value[fixtureFilters.group] || []).map(team => team.name.toLowerCase()))
    : null

  return fixtureItems.filter((fixture) => {
    if (!selectedGroupTeams) {
      return true
    }

    const homeName = String(fixture?.teams?.home?.name || '').toLowerCase()
    const awayName = String(fixture?.teams?.away?.name || '').toLowerCase()

    return selectedGroupTeams.has(homeName) || selectedGroupTeams.has(awayName)
  })
})

const groupedStandings = computed(() => {
  const rows: Array<{
    group: string
    rank: number
    team: { id: number | null, name: string, logo: string }
    points: number
    played: number
  }> = []

  for (const block of standings.value as GenericRecord[]) {
    const groups = block?.league?.standings || []
    for (const groupRows of groups) {
      for (const row of groupRows || []) {
        rows.push({
          group: String(row?.group || 'Sans groupe'),
          rank: Number(row?.rank || 0),
          team: {
            id: row?.team?.id ? Number(row.team.id) : null,
            name: String(row?.team?.name || '-'),
            logo: String(row?.team?.logo || ''),
          },
          points: Number(row?.points || 0),
          played: Number(row?.all?.played || 0),
        })
      }
    }
  }

  return rows.reduce<Record<string, typeof rows>>((acc, row) => {
    acc[row.group] = acc[row.group] || []
    acc[row.group].push(row)
    return acc
  }, {})
})

const selectedTeamFixtures = computed(() => {
  if (!selectedTeam.value?.id) {
    return []
  }

  return fixturesList.value.filter((fixture) => {
    const homeId = Number(fixture?.teams?.home?.id || 0)
    const awayId = Number(fixture?.teams?.away?.id || 0)
    return homeId === selectedTeam.value?.id || awayId === selectedTeam.value?.id
  })
})

const selectedFixture = computed(() => {
  const allFixtures = fixturesByResource.value.fixtures as GenericRecord[]
  return allFixtures.find(fixture => Number(fixture?.fixture?.id || fixture?.id) === selectedFixtureId.value) || null
})

const formatDate = (date?: string) => {
  if (!date) {
    return 'N/A'
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const loadBaseData = async () => {
  await Promise.allSettled([
    worldCupStore.fetchTeams(true),
    referenceStore.fetchSeasons({ league: WORLD_CUP_LEAGUE_ID }, true),
  ])

  if (seasons.value.length > 0) {
    const numericSeasons = seasons.value.map(year => Number(year)).filter(year => Number.isFinite(year))
    if (numericSeasons.length > 0) {
      selectedSeason.value = Math.max(...numericSeasons)
    }
  }

  await fetchStandings(true)
}

const fetchFixtures = async (force = true) => {
  await fixturesStore.fetchFixtures({
    league: WORLD_CUP_LEAGUE_ID,
    season: selectedSeason.value,
    date: fixtureFilters.date || undefined,
    status: fixtureFilters.status || undefined,
    team: fixtureFilters.team || undefined,
  }, force)
}

const fetchStandings = async (force = true) => {
  await standingsStore.fetchStandings({ league: WORLD_CUP_LEAGUE_ID, season: selectedSeason.value }, force)
}

const fetchPlayersPage = async (force = true) => {
  const result = await playersStore.fetchPlayers({
    league: WORLD_CUP_LEAGUE_ID,
    season: selectedSeason.value,
    page: playersPage.value,
  }, force)
  const payload = result as GenericRecord[]
  const paging = (playersStore as unknown as GenericRecord).lastPaging?.players
  playersMeta.value = {
    current: paging?.current || playersPage.value,
    total: paging?.total || Math.max(1, playersPage.value),
  }
  return payload
}

const fetchOddsPage = async () => {
  const result = await oddsStore.fetchOdds({
    league: WORLD_CUP_LEAGUE_ID,
    season: selectedSeason.value,
    page: oddsPage.value,
  })
  const payload = result as GenericRecord[]
  const paging = (oddsStore as unknown as GenericRecord).lastPaging?.odds
  oddsMeta.value = {
    current: paging?.current || oddsPage.value,
    total: paging?.total || Math.max(1, oddsPage.value),
  }
  return payload
}

const loadFixtureDetails = async () => {
  if (!selectedFixtureId.value) {
    return
  }

  await Promise.allSettled([
    fixturesStore.fetchEvents({ fixture: selectedFixtureId.value }, true),
    fixturesStore.fetchLineups({ fixture: selectedFixtureId.value }, true),
    fixturesStore.fetchStatistics({ fixture: selectedFixtureId.value }, true),
    fixturesStore.fetchPlayers({ fixture: selectedFixtureId.value }, true),
  ])
}

const loadPredictions = async () => {
  if (!selectedFixtureId.value) {
    return
  }

  await predictionsStore.fetchPredictions({ fixture: selectedFixtureId.value }, true)
}

const selectFixture = (fixture: GenericRecord) => {
  selectedFixtureId.value = Number(fixture?.fixture?.id || fixture?.id)

  const homeTeam = fixture?.teams?.home
  const awayTeam = fixture?.teams?.away

  if (!selectedTeam.value || (selectedTeam.value.id !== Number(homeTeam?.id || 0) && selectedTeam.value.id !== Number(awayTeam?.id || 0))) {
    if (homeTeam?.id) {
      selectedTeam.value = {
        id: Number(homeTeam.id),
        name: String(homeTeam?.name || 'N/A'),
        logo: String(homeTeam?.logo || ''),
        group: selectedTeam.value?.group || '-',
      }
    }
  }
}

const refreshOddsAndPredictions = async () => {
  if (!showOddsAndPredictions.value) {
    return
  }

  await Promise.allSettled([
    fetchOddsPage(true),
    loadPredictions(),
  ])
}

const selectStandingTeam = async (payload: { id: number | null, name: string, logo: string, group: string }) => {
  if (!payload.id) {
    return
  }

  fixtureFilters.team = payload.id
  selectedTeam.value = {
    id: payload.id,
    name: payload.name,
    logo: payload.logo,
    group: payload.group,
  }
  await fetchFixtures(true)
}

watch(() => playersPage.value, () => {
  void fetchPlayersPage(true)
})

watch(() => oddsPage.value, () => {
  if (!showOddsAndPredictions.value) {
    return
  }
  void fetchOddsPage(true)
})

watch(() => selectedFixtureId.value, () => {
  void loadFixtureDetails()
  if (showOddsAndPredictions.value) {
    void loadPredictions()
  }
})

onMounted(async () => {
  await loadBaseData()
  await Promise.allSettled([
    fetchFixtures(true),
    fetchPlayersPage(true),
  ])
})
</script>

<template>
  <NuxtLayout name="default">
    <main class="world-cup-page" aria-label="World Cup dashboard">
      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 mb-0">1) Équipes + groupes</h2>
          <v-chip :size="sectionChipSize" color="primary" variant="outlined">{{ teams.length }}</v-chip>
        </div>

        <v-alert v-if="worldCupStore.loading.teams" type="info" variant="tonal">Chargement des équipes...</v-alert>
        <v-alert v-else-if="worldCupStore.error.teams" type="error" variant="tonal">
          {{ isQuotaError(worldCupStore.error.teams) ? quotaMessage : 'Impossible de charger les équipes.' }}
        </v-alert>

        <div v-else class="team-groups-grid">
          <v-card v-for="(groupTeams, groupName) in groupedTeams" :key="groupName" variant="outlined" class="pa-3">
            <div class="text-subtitle-1 font-weight-bold mb-2">Groupe {{ groupName }}</div>
            <v-list density="compact" class="py-0 bg-transparent">
              <v-list-item v-for="team in groupTeams" :key="team.code" :title="team.name" :subtitle="team.code.toUpperCase()" />
            </v-list>
          </v-card>
        </div>
      </v-card>

      <div class="world-cup-main-layout" :class="{ 'is-mobile': smAndDown }">
        <div class="world-cup-left-column">
          <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
            <div class="d-flex align-center justify-space-between mb-3">
              <h2 class="text-h6 mb-0">3) Standings par groupe</h2>
              <v-btn size="small" variant="text" @click="fetchStandings(true)">Actualiser</v-btn>
            </div>

            <v-alert v-if="standingsLoading.standings || referenceLoading.seasons" type="info" variant="tonal">Chargement du classement...</v-alert>
            <v-alert v-else-if="standingsError.standings || referenceError.seasons" type="error" variant="tonal">
              {{ isQuotaError(standingsError.standings || referenceError.seasons) ? quotaMessage : 'Impossible de charger le classement.' }}
            </v-alert>

            <div v-else class="standings-grid">
              <v-card v-for="(rows, groupName) in groupedStandings" :key="groupName" variant="outlined" class="pa-3">
                <div class="text-subtitle-1 font-weight-bold mb-2">{{ groupName }}</div>
                <v-table :density="tableDensity" class="bg-transparent">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Équipe</th>
                      <th>Pts</th>
                      <th>J</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in rows" :key="`${groupName}-${row.rank}-${row.team.id || row.team.name}`">
                      <td>{{ row.rank }}</td>
                      <td>
                        <v-btn
                          variant="text"
                          density="comfortable"
                          class="team-link px-0 text-none"
                          @click="selectStandingTeam({ id: row.team.id, name: row.team.name, logo: row.team.logo, group: String(groupName) })"
                        >
                          <FootballAvatar :src="row.team.logo" :alt="`Logo ${row.team.name}`" :size="24" icon="mdi-shield-outline" class="mr-2" />
                          <span>{{ row.team.name }}</span>
                        </v-btn>
                      </td>
                      <td>{{ row.points }}</td>
                      <td>{{ row.played }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </v-card>

          <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
            <div class="d-flex align-center justify-space-between mb-3">
              <h2 class="text-h6 mb-0">2) Fixtures + filtres</h2>
          <v-chip :size="sectionChipSize" color="primary" variant="outlined">{{ fixturesList.length }}</v-chip>
        </div>

        <div class="filters-grid mb-4">
          <v-text-field v-model="fixtureFilters.date" label="Date (YYYY-MM-DD)" clearable hide-details density="compact" />
          <v-select v-model="fixtureFilters.group" :items="groupOptions" label="Groupe" hide-details density="compact" />
          <v-select
            v-model="fixtureFilters.team"
            :items="teamOptions"
            item-title="name"
            item-value="id"
            label="Équipe"
            clearable
            hide-details
            density="compact"
          />
          <v-text-field v-model="fixtureFilters.status" label="Statut (NS/FT/1H...)" clearable hide-details density="compact" />
          <v-btn color="primary" @click="fetchFixtures(true)">Appliquer</v-btn>
        </div>

        <v-alert v-if="fixturesLoading.fixtures" type="info" variant="tonal">Chargement des fixtures...</v-alert>
        <v-alert v-else-if="fixturesError.fixtures" type="error" variant="tonal">
          {{ isQuotaError(fixturesError.fixtures) ? quotaMessage : 'Impossible de charger les fixtures.' }}
        </v-alert>
        <v-table v-else :density="tableDensity" class="bg-transparent world-cup-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Match</th>
              <th>Statut</th>
              <th>Fixture ID</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fixture in fixturesList" :key="fixture?.fixture?.id || fixture?.id" @click="selectFixture(fixture)">
              <td>{{ formatDate(fixture?.fixture?.date) }}</td>
              <td>
                <div class="d-flex align-center ga-2">
                  <FootballAvatar :src="fixture?.teams?.home?.logo" :alt="`Logo ${fixture?.teams?.home?.name || 'Home'}`" :size="20" icon="mdi-shield-outline" />
                  <span class="text-body-2">{{ fixture?.teams?.home?.name || 'N/A' }}</span>
                  <span class="text-medium-emphasis">vs</span>
                  <FootballAvatar :src="fixture?.teams?.away?.logo" :alt="`Logo ${fixture?.teams?.away?.name || 'Away'}`" :size="20" icon="mdi-shield-outline" />
                  <span class="text-body-2">{{ fixture?.teams?.away?.name || 'N/A' }}</span>
                </div>
              </td>
              <td>{{ fixture?.fixture?.status?.short || 'N/A' }}</td>
              <td>{{ fixture?.fixture?.id || 'N/A' }}</td>
            </tr>
          </tbody>
        </v-table>
          </v-card>
        </div>

        <aside class="world-cup-aside">
          <v-card class="pa-4 section-card aside-sticky" variant="tonal">
            <div class="text-subtitle-1 font-weight-bold mb-3">Détails</div>

            <div class="aside-header mb-4">
              <div class="d-flex align-center mb-2">
                <FootballAvatar :src="selectedTeam?.logo" :alt="`Logo ${selectedTeam?.name}`" :size="36" icon="mdi-shield-outline" class="mr-3" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ selectedTeam?.name || 'Aucune équipe sélectionnée' }}</div>
                  <div v-if="selectedTeam" class="text-caption text-medium-emphasis">ID {{ selectedTeam.id }} · Groupe {{ selectedTeam.group }}</div>
                </div>
              </div>

              <v-card variant="outlined" class="pa-3">
                <div class="text-caption text-medium-emphasis">Fixture sélectionnée</div>
                <div class="text-body-2">{{ formatDate(selectedFixture?.fixture?.date) }}</div>
                <div class="text-body-2 font-weight-medium d-flex align-center ga-2 flex-wrap">
                  <FootballAvatar :src="selectedFixture?.teams?.home?.logo" :alt="`Logo ${selectedFixture?.teams?.home?.name || 'Home'}`" :size="18" icon="mdi-shield-outline" />
                  <span>{{ selectedFixture?.teams?.home?.name || 'N/A' }}</span>
                  <span>{{ selectedFixture?.goals?.home ?? '-' }} - {{ selectedFixture?.goals?.away ?? '-' }}</span>
                  <FootballAvatar :src="selectedFixture?.teams?.away?.logo" :alt="`Logo ${selectedFixture?.teams?.away?.name || 'Away'}`" :size="18" icon="mdi-shield-outline" />
                  <span>{{ selectedFixture?.teams?.away?.name || 'N/A' }}</span>
                </div>
                <div class="text-caption">Statut: {{ selectedFixture?.fixture?.status?.short || 'N/A' }} · ID {{ selectedFixtureId || 'N/A' }}</div>
              </v-card>
            </div>

            <v-text-field v-model.number="selectedFixtureId" type="number" label="Fixture ID" density="compact" hide-details class="mb-3" />

            <v-alert v-if="fixturesLoading.events || fixturesLoading.lineups || fixturesLoading.statistics || fixturesLoading.players" type="info" variant="tonal">
              Chargement des détails du match...
            </v-alert>
            <v-alert
              v-else-if="fixturesError.events || fixturesError.lineups || fixturesError.statistics || fixturesError.players"
              type="error"
              variant="tonal"
            >
              {{ isQuotaError(fixturesError.events || fixturesError.lineups || fixturesError.statistics || fixturesError.players) ? quotaMessage : 'Impossible de charger les détails du match.' }}
            </v-alert>

            <div v-else class="details-grid">
              <MatchEventsTimeline :events="matchDetails.events" />
              <MatchLineupsBoard :lineups="matchDetails.lineups" />
              <MatchStatisticsCompare :statistics="matchDetails.statistics" />
              <MatchPlayersTable :players="matchDetails.players" />
            </div>

            <v-alert v-if="selectedTeam" type="info" variant="tonal" class="mt-3">Fixtures filtrées pour l’équipe sélectionnée.</v-alert>
            <v-list v-if="selectedTeam" density="compact">
              <v-list-item
                v-for="fixture in selectedTeamFixtures"
                :key="fixture?.fixture?.id || fixture?.id"
                :title="`${fixture?.teams?.home?.name || 'N/A'} vs ${fixture?.teams?.away?.name || 'N/A'}`"
                :subtitle="formatDate(fixture?.fixture?.date)"
                @click="selectFixture(fixture)"
              />
            </v-list>
          </v-card>
        </aside>
      </div>

      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 mb-0">5) Predictions / Odds (optionnel)</h2>
          <v-switch v-model="showOddsAndPredictions" label="Activer" color="primary" hide-details inset @update:model-value="refreshOddsAndPredictions" />
        </div>

        <v-alert v-if="!showOddsAndPredictions" type="info" variant="tonal">Bloc optionnel désactivé (économie de quota API).</v-alert>

        <template v-else>
          <v-alert v-if="oddsLoading.odds || predictionsLoading" type="info" variant="tonal">Chargement des cotes / prédictions...</v-alert>
          <v-alert v-else-if="oddsError.odds || predictionsError" type="error" variant="tonal">
            {{ isQuotaError(oddsError.odds || predictionsError) ? quotaMessage : 'Impossible de charger cotes / prédictions.' }}
          </v-alert>

          <div v-else class="details-grid">
            <v-card variant="outlined" class="pa-3">
              <div class="text-subtitle-2 mb-2">Odds</div>
              <pre>{{ JSON.stringify(oddsByResource.odds, null, 2) }}</pre>
              <v-pagination v-model="oddsPage" :length="oddsMeta.total" :total-visible="7" class="mt-3" />
            </v-card>
            <v-card variant="outlined" class="pa-3">
              <div class="text-subtitle-2 mb-2">Predictions</div>
              <pre>{{ JSON.stringify(predictions, null, 2) }}</pre>
            </v-card>
          </div>
        </template>
      </v-card>

      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 mb-0">Pagination endpoint players</h2>
          <v-chip :size="sectionChipSize" color="primary" variant="outlined">Page {{ playersMeta.current }} / {{ playersMeta.total }}</v-chip>
        </div>

        <v-alert v-if="playersLoading.players" type="info" variant="tonal">Chargement des joueurs...</v-alert>
        <v-alert v-else-if="playersError.players" type="error" variant="tonal">
          {{ isQuotaError(playersError.players) ? quotaMessage : 'Impossible de charger les joueurs.' }}
        </v-alert>

        <div v-else>
          <pre>{{ JSON.stringify(playersByResource.players, null, 2) }}</pre>
          <v-pagination v-model="playersPage" :length="playersMeta.total" :total-visible="7" class="mt-3" />
        </div>
      </v-card>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.world-cup-page {
  display: grid;
  gap: 20px;
}

.section-card {
  border-radius: 16px;
}

.world-cup-main-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 20px;
}

.world-cup-left-column {
  display: grid;
  gap: 20px;
}

.aside-sticky {
  position: sticky;
  top: 20px;
}

.team-groups-grid,
.filters-grid,
.standings-grid,
.details-grid {
  display: grid;
  gap: 12px;
}

.filters-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: center;
}

.team-groups-grid,
.standings-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.details-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

pre {
  max-height: 260px;
  overflow: auto;
  padding: 8px;
  border-radius: 8px;
  background: rgba(120, 120, 120, 0.08);
  font-size: 0.72rem;
}

.world-cup-table :deep(tbody tr) {
  cursor: pointer;
}

.world-cup-table :deep(th),
.world-cup-table :deep(td) {
  white-space: nowrap;
}

.team-link {
  justify-content: flex-start;
}

.world-cup-main-layout.is-mobile {
  grid-template-columns: 1fr;
}

.world-cup-main-layout.is-mobile .aside-sticky {
  position: static;
}
</style>
