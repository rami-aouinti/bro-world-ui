<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { MatchPlayersByTeam } from '~/components/football/types'
import {
  asArray,
  normalizeFixtureStatistics,
  toNumber,
  type FixtureEvent,
  type FixtureItem,
  type FixtureLineup,
  type FixturePlayersResponse,
  type FixtureStandingsBlock,
  type FixtureStatistics,
} from '~/types/fifa'
import MatchEventsTimeline from "~/components/football/MatchEventsTimeline.vue";
import MatchLineupsBoard from "~/components/football/MatchLineupsBoard.vue";
import MatchStatisticsCompare from "~/components/football/MatchStatisticsCompare.vue";
import MatchPlayersTable from "~/components/football/MatchPlayersTable.vue";

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})
const tab = ref('one')
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
  const candidate = err as { data?: { error?: { code?: string } }, statusCode?: number } | null
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
  const fixtureItems = asArray<FixtureItem>(fixturesByResource.value.fixtures)
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
  events: asArray<FixtureEvent>(fixturesByResource.value.events),
  lineups: asArray<FixtureLineup>(fixturesByResource.value.lineups),
  statistics: normalizeFixtureStatistics(asArray<FixtureStatistics>(fixturesByResource.value.statistics)),
  players: asArray<FixturePlayersResponse>(fixturesByResource.value.players) as MatchPlayersByTeam[],
}))

const fixturesList = computed(() => {
  const fixtureItems = asArray<FixtureItem>(fixturesByResource.value.fixtures)
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

const groupedStandings = computed<Record<string, Array<{
  group: string
  rank: number
  team: { id: number | null, name: string, logo: string }
  points: number
  played: number
}>>>(() => {
  const rows: Array<{
    group: string
    rank: number
    team: { id: number | null, name: string, logo: string }
    points: number
    played: number
  }> = []

  for (const block of asArray<FixtureStandingsBlock>(standings.value)) {
    const groups = block?.league?.standings || []
    for (const groupRows of groups) {
      for (const row of groupRows || []) {
        rows.push({
          group: String(row?.group || 'Sans groupe'),
          rank: toNumber(row?.rank),
          team: {
            id: row?.team?.id != null ? toNumber(row.team.id, 0) : null,
            name: String(row?.team?.name || '-'),
            logo: String(row?.team?.logo || ''),
          },
          points: toNumber(row?.points),
          played: toNumber(row?.all?.played),
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
    const homeId = toNumber(fixture?.teams?.home?.id)
    const awayId = toNumber(fixture?.teams?.away?.id)
    return homeId === selectedTeam.value?.id || awayId === selectedTeam.value?.id
  })
})

const selectedFixture = computed(() => {
  const allFixtures = asArray<FixtureItem>(fixturesByResource.value.fixtures)
  return allFixtures.find(fixture => toNumber(fixture?.fixture?.id ?? fixture?.id) === selectedFixtureId.value) || null
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
  const payload = asArray<MatchPlayersByTeam>(result)
  const paging = (playersStore as unknown as { lastPaging?: { players?: { current?: number, total?: number } } }).lastPaging?.players
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
  const payload = asArray<Record<string, unknown>>(result)
  const paging = (oddsStore as unknown as { lastPaging?: { odds?: { current?: number, total?: number } } }).lastPaging?.odds
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

const selectFixture = (fixture: FixtureItem) => {
  selectedFixtureId.value = toNumber(fixture?.fixture?.id ?? fixture?.id)

  const homeTeam = fixture?.teams?.home
  const awayTeam = fixture?.teams?.away

  if (!selectedTeam.value || (selectedTeam.value.id !== toNumber(homeTeam?.id) && selectedTeam.value.id !== toNumber(awayTeam?.id))) {
    if (homeTeam?.id != null) {
      selectedTeam.value = {
        id: toNumber(homeTeam.id),
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
    <template #layout-sidebar>
      <div class="d-flex align-center justify-space-between mb-3">
        <v-btn size="small" variant="text" @click="fetchStandings(true)">Refresh</v-btn>
      </div>

      <v-alert v-if="standingsLoading.standings || referenceLoading.seasons" type="info" variant="tonal">Loading...</v-alert>
      <v-alert v-else-if="standingsError.standings || referenceError.seasons" type="error" variant="tonal">
        {{ isQuotaError(standingsError.standings || referenceError.seasons) ? quotaMessage : 'Impossible de charger le classement.' }}
      </v-alert>

      <div v-else class="standings-grid">
        <v-card v-for="(rows, groupName) in groupedStandings" :key="groupName" variant="outlined" class="pa-1">
          <div class="text-subtitle-1 font-weight-bold mb-2">{{ groupName }}</div>
          <v-table :density="tableDensity" class="bg-transparent">
            <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Pts</th>
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
            </tr>
            </tbody>
          </v-table>
        </v-card>
      </div>
    </template>
    <template #layout-aside>
      <v-list v-if="selectedTeam" density="confortable" class="bg-transparent">
        <v-list-item
            class="d-flex align-center"
            v-for="fixture in selectedTeamFixtures"
            :key="fixture?.fixture?.id || fixture?.id"
            :title="`${fixture?.teams?.home?.name || 'N/A'} vs ${fixture?.teams?.away?.name || 'N/A'}`"
            :subtitle="formatDate(fixture?.fixture?.date)"
            @click="selectFixture(fixture)"
        />
      </v-list>
    </template>
    <main  aria-label="World Cup dashboard">

      <div class="aside-header mb-4">
        <div class="d-flex align-center mb-2">
          <FootballAvatar :src="selectedTeam?.logo" :alt="`Logo ${selectedTeam?.name}`" :size="36" icon="mdi-shield-outline" class="mr-3" />
          <div>
            <div class="text-body-1 font-weight-medium">{{ selectedTeam?.name || 'Aucune équipe sélectionnée' }}</div>
            <div v-if="selectedTeam" class="text-caption text-medium-emphasis">Group {{ selectedTeam.group }}</div>
          </div>
        </div>

        <v-card variant="outlined" class="pa-3">
          <div class="text-body-2 d-flex text-center justify-center">{{ formatDate(selectedFixture?.fixture?.date) }}</div>
          <div class="text-body-2 font-weight-medium d-flex align-center ga-2 flex-wrap">
            <FootballAvatar :src="selectedFixture?.teams?.home?.logo" :alt="`Logo ${selectedFixture?.teams?.home?.name || 'Home'}`" :size="48" icon="mdi-shield-outline" />
            <h1>{{ selectedFixture?.teams?.home?.name || 'N/A' }}</h1>
            <h1>{{ selectedFixture?.goals?.home ?? '-' }} </h1>
            <v-spacer></v-spacer>
            <h1>{{ selectedFixture?.goals?.away ?? '-' }}</h1>
            <h1>{{ selectedFixture?.teams?.away?.name || 'N/A' }}</h1>
            <FootballAvatar :src="selectedFixture?.teams?.away?.logo" :alt="`Logo ${selectedFixture?.teams?.away?.name || 'Away'}`" :size="48" icon="mdi-shield-outline" />
          </div>
          <div class="text-caption d-flex text-center justify-center">{{ selectedFixture?.fixture?.status?.short || 'N/A' }}</div>
        </v-card>
      </div>

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

      <v-sheet v-else elevation="2">
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab value="one">Timeline</v-tab>
          <v-tab value="two">Lineups</v-tab>
          <v-tab value="three">Statistics</v-tab>
          <v-tab value="four">Players</v-tab>
        </v-tabs>

        <v-divider></v-divider>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="one">
            <MatchEventsTimeline :events="matchDetails.events" />
          </v-tabs-window-item>
          <v-tabs-window-item value="two">
            <MatchLineupsBoard :lineups="matchDetails.lineups" />
          </v-tabs-window-item>
          <v-tabs-window-item value="three">
            <MatchStatisticsCompare :statistics="matchDetails.statistics" />
          </v-tabs-window-item>
          <v-tabs-window-item value="four">
            <MatchPlayersTable :players="matchDetails.players" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-sheet>
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
