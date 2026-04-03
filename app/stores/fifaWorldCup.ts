import type {
  FifaWorldCupMatch,
  FifaWorldCupStanding,
  FifaWorldCupStadium,
  FifaWorldCupTeam,
} from '~/composables/fifa/useFifaWorldCup'
import { useFifaWorldCup } from '~/composables/fifa/useFifaWorldCup'

const WORLD_CUP_CACHE_TTL_MS = 60_000

type ResourceKey = 'teams' | 'stadiums' | 'standings' | 'matches'

export const useFifaWorldCupStore = defineStore('fifaWorldCup', () => {
  const { getTeams, getStadiums, getGroupStandings, getMatches } = useFifaWorldCup()

  const teams = ref<FifaWorldCupTeam[]>([])
  const stadiums = ref<FifaWorldCupStadium[]>([])
  const standingsByGroup = ref<Record<string, FifaWorldCupStanding[]>>({})
  const matches = ref<FifaWorldCupMatch[]>([])

  const loading = ref<Record<ResourceKey, boolean>>({
    teams: false,
    stadiums: false,
    standings: false,
    matches: false,
  })

  const error = ref<Record<ResourceKey, Error | null>>({
    teams: null,
    stadiums: null,
    standings: null,
    matches: null,
  })

  const lastUpdatedAt = ref<Record<ResourceKey, number>>({
    teams: 0,
    stadiums: 0,
    standings: 0,
    matches: 0,
  })

  const isFresh = (resource: ResourceKey) => Date.now() - lastUpdatedAt.value[resource] < WORLD_CUP_CACHE_TTL_MS

  const fetchTeams = async (force = false) => {
    if (!force && teams.value.length && isFresh('teams')) {
      return teams.value
    }

    loading.value.teams = true
    error.value.teams = null
    try {
      teams.value = await getTeams({ fallbackOnError: false, bypassCache: force })
      lastUpdatedAt.value.teams = Date.now()
      return teams.value
    } catch (err) {
      error.value.teams = err instanceof Error ? err : new Error('Failed to fetch teams')
      throw err
    } finally {
      loading.value.teams = false
    }
  }

  const fetchStadiums = async (force = false) => {
    if (!force && stadiums.value.length && isFresh('stadiums')) {
      return stadiums.value
    }

    loading.value.stadiums = true
    error.value.stadiums = null
    try {
      stadiums.value = await getStadiums({ fallbackOnError: false, bypassCache: force })
      lastUpdatedAt.value.stadiums = Date.now()
      return stadiums.value
    } catch (err) {
      error.value.stadiums = err instanceof Error ? err : new Error('Failed to fetch stadiums')
      throw err
    } finally {
      loading.value.stadiums = false
    }
  }

  const fetchStandings = async (force = false) => {
    if (!force && Object.keys(standingsByGroup.value).length && isFresh('standings')) {
      return standingsByGroup.value
    }

    loading.value.standings = true
    error.value.standings = null
    try {
      standingsByGroup.value = await getGroupStandings({ fallbackOnError: false, bypassCache: force })
      lastUpdatedAt.value.standings = Date.now()
      return standingsByGroup.value
    } catch (err) {
      error.value.standings = err instanceof Error ? err : new Error('Failed to fetch standings')
      throw err
    } finally {
      loading.value.standings = false
    }
  }

  const fetchMatches = async (force = false) => {
    if (!force && matches.value.length && isFresh('matches')) {
      return matches.value
    }

    loading.value.matches = true
    error.value.matches = null
    try {
      matches.value = await getMatches({ fallbackOnError: false, bypassCache: force })
      lastUpdatedAt.value.matches = Date.now()
      return matches.value
    } catch (err) {
      error.value.matches = err instanceof Error ? err : new Error('Failed to fetch matches')
      throw err
    } finally {
      loading.value.matches = false
    }
  }

  const fetchAll = async (force = false) => {
    await Promise.all([
      fetchTeams(force),
      fetchStadiums(force),
      fetchStandings(force),
      fetchMatches(force),
    ])
  }

  return {
    teams,
    stadiums,
    standingsByGroup,
    matches,
    loading,
    error,
    lastUpdatedAt,
    fetchTeams,
    fetchStadiums,
    fetchStandings,
    fetchMatches,
    fetchAll,
  }
})
