<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSportContext } from '~/components/sport/sportContext'
import type { ApiSportsEndpointFilterMatrix } from '~~/lib/apisportsFilters'
import { buildApiSportsQuery } from '~~/lib/apisportsFilters'
import type { SportPlayerItem } from '~/components/sport/types'
import { useSportDashboardStore } from '~/stores/sportDashboard'

definePageMeta({
  public: true,
  requiresAuth: false,
})

type ApiSportsPlayersResponse = {
  response?: Array<{
    player?: {
      id?: number
      name?: string
      photo?: string
      age?: number
      height?: string
      weight?: string
    }
    statistics?: Array<{
      team?: {
        name?: string
        logo?: string
      }
      league?: {
        name?: string
      }
      games?: {
        position?: string
        appearences?: number
      }
      goals?: {
        total?: number
        assists?: number
      }
    }>
  }>
  paging?: {
    current?: number
    total?: number
  }
}

const PLAYERS_WHITELIST = ['football']

const route = useRoute()
const router = useRouter()
const { t, te } = useI18n()

const sportSlug = computed(() => String(route.params.sport ?? 'sport'))
const sport = computed(() => getSportContext(sportSlug.value, t, te))

const dashboardStore = useSportDashboardStore()
const dashboardSelection = computed(() => dashboardStore.ensureSportSelection(sportSlug.value))

const leagueFilter = ref(typeof route.query.league === 'string' ? route.query.league : (dashboardSelection.value.leagueId || ''))
const teamFilter = ref(typeof route.query.team === 'string' ? route.query.team : (dashboardSelection.value.teamId || ''))
const seasonFilter = ref(typeof route.query.season === 'string' ? route.query.season : (dashboardSelection.value.season ? String(dashboardSelection.value.season) : ''))
const searchFilter = ref(typeof route.query.search === 'string' ? route.query.search : '')
const gameIdFilter = ref(typeof route.query.gameId === 'string' ? route.query.gameId : '')
const page = ref(Number.parseInt(typeof route.query.page === 'string' ? route.query.page : '1', 10) || 1)
const selectedPlayerId = ref<string | null>(null)

const isSupportedSport = computed(() => PLAYERS_WHITELIST.includes(sportSlug.value))

const playersFiltersMatrix = {
  optional: {
    league: 'number',
    team: 'number',
    gameId: 'number',
    search: 'string',
    season: 'number',
    page: 'number',
  },
} satisfies ApiSportsEndpointFilterMatrix

const playersMetaKey = computed(() => `sport-players-meta-${sportSlug.value}`)
const { data: playersMeta } = await useAsyncData(
  playersMetaKey,
  async () => {
    if (!isSupportedSport.value) {
      return null
    }

    return $fetch<{ filters: ApiSportsEndpointFilterMatrix }>(`/api/apisports/${sportSlug.value}/_meta/players`)
  },
  {
    server: true,
    default: () => null,
    watch: [sportSlug],
  },
)

const activeFiltersMatrix = computed<ApiSportsEndpointFilterMatrix>(() => playersMeta.value?.filters || playersFiltersMatrix)
const allowedFilterKeys = computed(() => {
  const optionalKeys = Object.keys(activeFiltersMatrix.value.optional || {})
  const groupKeys = (activeFiltersMatrix.value.atLeastOneGroup || []).flat()
  return new Set([...(activeFiltersMatrix.value.required || []), ...optionalKeys, ...groupKeys])
})

const supportsGameId = computed(() => allowedFilterKeys.value.has('gameId'))

const hasValue = (value: string | number | null | undefined) => String(value || '').trim().length > 0
const requiredCouples = [['league', 'season']] as const

const ensureRequiredCouples = () => {
  for (const [left, right] of requiredCouples) {
    const pairAllowed = allowedFilterKeys.value.has(left) && allowedFilterKeys.value.has(right)
    if (!pairAllowed) {
      continue
    }

    const leftValue = left === 'league' ? leagueFilter.value : seasonFilter.value
    const rightValue = right === 'season' ? seasonFilter.value : leagueFilter.value
    const leftPresent = hasValue(leftValue)
    const rightPresent = hasValue(rightValue)

    if (leftPresent && !rightPresent && right === 'season' && dashboardSelection.value.season) {
      seasonFilter.value = String(dashboardSelection.value.season)
    }

    if (rightPresent && !leftPresent && left === 'league' && dashboardSelection.value.leagueId) {
      leagueFilter.value = dashboardSelection.value.leagueId
    }
  }
}

const isMinimumFiltersSatisfied = computed(() => {
  const required = activeFiltersMatrix.value.required || []
  const requiredOk = required.every((key) => {
    if (key === 'league')
      return hasValue(leagueFilter.value)
    if (key === 'team')
      return hasValue(teamFilter.value)
    if (key === 'season')
      return hasValue(seasonFilter.value)
    if (key === 'search')
      return hasValue(searchFilter.value)
    if (key === 'gameId')
      return hasValue(gameIdFilter.value)
    if (key === 'page')
      return page.value > 0
    return true
  })

  if (!requiredOk) {
    return false
  }

  return requiredCouples.every(([left, right]) => {
    const pairAllowed = allowedFilterKeys.value.has(left) && allowedFilterKeys.value.has(right)
    if (!pairAllowed) {
      return true
    }

    const leftPresent = left === 'league' ? hasValue(leagueFilter.value) : hasValue(seasonFilter.value)
    const rightPresent = right === 'season' ? hasValue(seasonFilter.value) : hasValue(leagueFilter.value)
    return (leftPresent && rightPresent) || (!leftPresent && !rightPresent)
  })
})

const appliedQuery = ref<Record<string, string | number | boolean>>({})

const apiQuery = computed(() => {
  return buildApiSportsQuery(activeFiltersMatrix.value, {
    league: leagueFilter.value,
    team: teamFilter.value,
    gameId: gameIdFilter.value,
    search: searchFilter.value,
    season: seasonFilter.value,
    page: Math.max(1, page.value),
  })
})

const applyFilters = () => {
  ensureRequiredCouples()
  if (!isMinimumFiltersSatisfied.value) {
    return
  }

  appliedQuery.value = { ...apiQuery.value }
}

watch(
  () => route.query,
  (query) => {
    leagueFilter.value = typeof query.league === 'string' ? query.league : ''
    teamFilter.value = typeof query.team === 'string' ? query.team : ''
    gameIdFilter.value = typeof query.gameId === 'string' ? query.gameId : ''
    searchFilter.value = typeof query.search === 'string' ? query.search : ''
    seasonFilter.value = typeof query.season === 'string' ? query.season : (dashboardSelection.value.season ? String(dashboardSelection.value.season) : '')
    page.value = Number.parseInt(typeof query.page === 'string' ? query.page : '1', 10) || 1
  },
)

watch([
  leagueFilter,
  teamFilter,
  gameIdFilter,
  searchFilter,
  seasonFilter,
  page,
], () => {
  const nextQuery: Record<string, string> = {}

  if (leagueFilter.value.trim()) {
    nextQuery.league = leagueFilter.value.trim()
  }

  if (teamFilter.value.trim()) {
    nextQuery.team = teamFilter.value.trim()
  }

  if (gameIdFilter.value.trim() && supportsGameId.value) {
    nextQuery.gameId = gameIdFilter.value.trim()
  }

  if (searchFilter.value.trim()) {
    nextQuery.search = searchFilter.value.trim()
  }

  if (seasonFilter.value.trim()) {
    nextQuery.season = seasonFilter.value.trim()
  }

  if (page.value > 1) {
    nextQuery.page = String(page.value)
  }

  const currentQuery = route.query
  const hasChanged = ['league', 'team', 'gameId', 'search', 'season', 'page'].some(key => String(currentQuery[key] || '') !== String(nextQuery[key] || ''))

  if (hasChanged) {
    router.replace({ query: nextQuery })
  }
})

watch([sportSlug, isSupportedSport], () => {
  if (isSupportedSport.value) {
    applyFilters()
  } else {
    appliedQuery.value = {}
  }
}, { immediate: true })

const { data, pending, error, refresh } = await useAsyncData(
  () => `sport-players-${sportSlug.value}-${JSON.stringify(appliedQuery.value)}`,
  async () => {
    if (!isSupportedSport.value) {
      return { response: [], paging: { current: 1, total: 1 } }
    }

    return $fetch<ApiSportsPlayersResponse>(`/api/apisports/${sportSlug.value}/players`, {
      query: appliedQuery.value,
    })
  },
  {
    server: true,
    watch: [sportSlug, appliedQuery],
    default: () => ({ response: [], paging: { current: 1, total: 1 } }),
  },
)

const players = computed<SportPlayerItem[]>(() => {
  return (data.value?.response || [])
    .map((entry) => {
      const playerId = entry.player?.id
      if (!playerId) {
        return null
      }

      const stats = entry.statistics?.[0]

      return {
        id: String(playerId),
        name: entry.player?.name || 'Unknown player',
        photo: entry.player?.photo || '',
        age: entry.player?.age ?? null,
        height: entry.player?.height || '',
        weight: entry.player?.weight || '',
        team: stats?.team?.name || '',
        teamLogo: stats?.team?.logo || '',
        position: stats?.games?.position || '',
        league: stats?.league?.name || '',
        appearances: stats?.games?.appearences ?? null,
        goals: stats?.goals?.total ?? null,
        assists: stats?.goals?.assists ?? null,
      }
    })
    .filter((player): player is SportPlayerItem => Boolean(player))
})

const currentPage = computed(() => data.value?.paging?.current || page.value || 1)
const totalPages = computed(() => data.value?.paging?.total || 1)

const selectedPlayer = computed(() => {
  if (!selectedPlayerId.value) {
    return players.value[0] || null
  }

  return players.value.find(player => player.id === selectedPlayerId.value) || players.value[0] || null
})


watch([leagueFilter, teamFilter, seasonFilter], () => {
  dashboardStore.setSelection(sportSlug.value, {
    leagueId: leagueFilter.value.trim() || null,
    teamId: teamFilter.value.trim() || null,
    season: seasonFilter.value.trim() ? Number(seasonFilter.value) : null,
  })
})

watch(players, (nextPlayers) => {
  if (!nextPlayers.length) {
    selectedPlayerId.value = null
    return
  }

  if (!selectedPlayerId.value || !nextPlayers.some(player => player.id === selectedPlayerId.value)) {
    selectedPlayerId.value = nextPlayers[0].id
  }
}, { immediate: true })
</script>

<template>
  <UiPageShell :title="sport.label" :description="t('app.navigation.sport')">
    <div class="d-flex flex-column ga-4 ga-md-6">
      <SportSegmentedNav
        :sport-slug="sport.slug"
        active-section="players"
      />

      <div class="sport-dashboard">
        <aside class="sport-dashboard__left">
          <v-card variant="tonal" class="pa-4 d-flex flex-column ga-3">
            <p class="text-subtitle-2 mb-0">Filters</p>
            <v-text-field
              v-model="leagueFilter"
              label="League ID"
              density="comfortable"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-model="teamFilter"
              label="Team ID"
              density="comfortable"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-if="supportsGameId"
              v-model="gameIdFilter"
              label="Game ID"
              density="comfortable"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-model="searchFilter"
              :label="t('sport.filters.search')"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
            <v-btn
              color="primary"
              variant="flat"
              :disabled="pending || !isMinimumFiltersSatisfied"
              @click="applyFilters"
            >
              Search
            </v-btn>
          </v-card>
        </aside>

        <main class="sport-dashboard__center">
          <v-card variant="tonal" class="pa-4">
            <div class="d-flex justify-space-between align-center ga-2 mb-4">
              <p class="text-body-1 mb-0">Players</p>
              <v-chip size="small" variant="outlined">
                Page {{ currentPage }} / {{ totalPages }}
              </v-chip>
            </div>

            <UiStateAlert
              v-if="!isSupportedSport"
              type="warning"
              class="mb-4"
            >
              Players endpoint is not whitelisted for this sport.
            </UiStateAlert>

            <UiLoadingState
              v-else-if="pending"
              variant="cards"
              :cards="3"
              message="Loading players..."
            />

            <template v-else-if="error">
              <UiStateAlert type="error" class="mb-4">
                Unable to load players.
              </UiStateAlert>
              <v-btn color="primary" variant="flat" @click="refresh()">
                {{ t('sport.retry') }}
              </v-btn>
            </template>

            <UiEmptyState
              v-else-if="players.length === 0"
              title="No players found"
              description="Adjust filters or go to another page."
              icon="mdi-account-search-outline"
            />

            <SportPlayersList
              v-else
              :players="players"
              :selected-player-id="selectedPlayerId"
              @select="selectedPlayerId = $event"
            />

            <div v-if="isSupportedSport" class="d-flex justify-end ga-2 mt-4">
              <v-btn
                variant="outlined"
                :disabled="page <= 1 || pending"
                @click="page = Math.max(1, page - 1)"
              >
                Previous
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                :disabled="page >= totalPages || pending"
                @click="page = Math.min(totalPages, page + 1)"
              >
                Next
              </v-btn>
            </div>
          </v-card>
        </main>

        <aside class="sport-dashboard__right">
          <v-card variant="tonal" class="pa-4">
            <template v-if="selectedPlayer">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar size="52" color="surface-variant">
                  <v-img v-if="selectedPlayer.photo" :src="selectedPlayer.photo" :alt="selectedPlayer.name" cover />
                  <v-icon v-else icon="mdi-account-outline" />
                </v-avatar>
                <div>
                  <p class="text-overline mb-1">Player details</p>
                  <p class="text-h6 mb-0">{{ selectedPlayer.name }}</p>
                </div>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span>Team</span>
                <span>{{ selectedPlayer.team || '-' }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Position</span>
                <span>{{ selectedPlayer.position || '-' }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Appearances</span>
                <span>{{ selectedPlayer.appearances ?? '-' }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Goals</span>
                <span>{{ selectedPlayer.goals ?? '-' }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Assists</span>
                <span>{{ selectedPlayer.assists ?? '-' }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span>Profile</span>
                <span>{{ selectedPlayer.height || '-' }} / {{ selectedPlayer.weight || '-' }}</span>
              </div>
            </template>

            <UiEmptyState
              v-else
              title="No player selected"
              description="Select a player to inspect team and basic statistics."
              icon="mdi-account-outline"
            />
          </v-card>
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
}
</style>
