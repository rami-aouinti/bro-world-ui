<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSportContext } from '~/components/sport/sportContext'
import type { SportPlayerItem } from '~/components/sport/types'

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

const leagueFilter = ref(typeof route.query.league === 'string' ? route.query.league : '')
const teamFilter = ref(typeof route.query.team === 'string' ? route.query.team : '')
const searchFilter = ref(typeof route.query.search === 'string' ? route.query.search : '')
const page = ref(Number.parseInt(typeof route.query.page === 'string' ? route.query.page : '1', 10) || 1)
const selectedPlayerId = ref<string | null>(null)

const isSupportedSport = computed(() => PLAYERS_WHITELIST.includes(sportSlug.value))

const apiQuery = computed(() => {
  const query: Record<string, string | number> = {
    page: Math.max(1, page.value),
  }

  if (leagueFilter.value.trim()) {
    query.league = leagueFilter.value.trim()
  }

  if (teamFilter.value.trim()) {
    query.team = teamFilter.value.trim()
  }

  if (searchFilter.value.trim()) {
    query.search = searchFilter.value.trim()
  }

  return query
})

watch(
  () => route.query,
  (query) => {
    leagueFilter.value = typeof query.league === 'string' ? query.league : ''
    teamFilter.value = typeof query.team === 'string' ? query.team : ''
    searchFilter.value = typeof query.search === 'string' ? query.search : ''
    page.value = Number.parseInt(typeof query.page === 'string' ? query.page : '1', 10) || 1
  },
)

watch([
  leagueFilter,
  teamFilter,
  searchFilter,
  page,
], () => {
  const nextQuery: Record<string, string> = {}

  if (leagueFilter.value.trim()) {
    nextQuery.league = leagueFilter.value.trim()
  }

  if (teamFilter.value.trim()) {
    nextQuery.team = teamFilter.value.trim()
  }

  if (searchFilter.value.trim()) {
    nextQuery.search = searchFilter.value.trim()
  }

  if (page.value > 1) {
    nextQuery.page = String(page.value)
  }

  const currentQuery = route.query
  const hasChanged = ['league', 'team', 'search', 'page'].some(key => String(currentQuery[key] || '') !== String(nextQuery[key] || ''))

  if (hasChanged) {
    router.replace({ query: nextQuery })
  }
})

const { data, pending, error, refresh } = await useAsyncData(
  () => `sport-players-${sportSlug.value}-${JSON.stringify(apiQuery.value)}`,
  async () => {
    if (!isSupportedSport.value) {
      return { response: [], paging: { current: 1, total: 1 } }
    }

    return $fetch<ApiSportsPlayersResponse>(`/api/apisports/${sportSlug.value}/players`, {
      query: apiQuery.value,
    })
  },
  {
    server: true,
    watch: [sportSlug, apiQuery],
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
              v-model="searchFilter"
              :label="t('sport.filters.search')"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
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
