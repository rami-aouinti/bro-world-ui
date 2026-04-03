import type {
  FifaWorldCupStadium,
  FifaWorldCupTeam,
} from '~/composables/fifa/useFifaWorldCup'
import { useFifaWorldCup } from '~/composables/fifa/useFifaWorldCup'

const WORLD_CUP_CACHE_TTL_MS = 60_000

type ResourceKey = 'teams' | 'stadiums'

export const useFifaWorldCupStore = defineStore('fifaWorldCup', () => {
  const { getTeams, getStadiums } = useFifaWorldCup()

  const teams = ref<FifaWorldCupTeam[]>([])
  const stadiums = ref<FifaWorldCupStadium[]>([])

  const loading = ref<Record<ResourceKey, boolean>>({
    teams: false,
    stadiums: false,
  })

  const error = ref<Record<ResourceKey, Error | null>>({
    teams: null,
    stadiums: null,
  })

  const lastUpdatedAt = ref<Record<ResourceKey, number>>({
    teams: 0,
    stadiums: 0,
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

  const fetchAll = async (force = false) => {
    await Promise.all([
      fetchTeams(force),
      fetchStadiums(force),
    ])
  }

  return {
    teams,
    stadiums,
    loading,
    error,
    lastUpdatedAt,
    fetchTeams,
    fetchStadiums,
    fetchAll,
  }
})
