import { useFifaStandingsApi } from '~/composables/fifa/useFifaStandingsApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_STANDINGS_TTL_MS = 300_000

type StandingsResource = 'standings' | 'teamStatistics'

export const useFifaStandingsStore = defineStore('fifaStandings', () => {
  const api = useFifaStandingsApi()

  const standings = ref<unknown[]>([])
  const teamStatistics = ref<unknown[]>([])
  const loading = ref<Record<StandingsResource, boolean>>({ standings: false, teamStatistics: false })
  const error = ref<Record<StandingsResource, Error | null>>({ standings: null, teamStatistics: null })
  const cacheAt = ref<Record<StandingsResource, number>>({ standings: 0, teamStatistics: 0 })

  const isFresh = (resource: StandingsResource) => Date.now() - cacheAt.value[resource] < FIFA_STANDINGS_TTL_MS

  const fetchResource = async (resource: StandingsResource, force: boolean, loader: () => Promise<{ items: unknown[] }>) => {
    const target = resource === 'standings' ? standings : teamStatistics

    if (!force && target.value.length > 0 && isFresh(resource)) {
      return target.value
    }

    loading.value[resource] = true
    error.value[resource] = null
    try {
      const result = await loader()
      target.value = result.items
      cacheAt.value[resource] = Date.now()
      return target.value
    }
    catch (err) {
      error.value[resource] = err instanceof Error ? err : new Error(`Failed to fetch ${resource}`)
      throw err
    }
    finally {
      loading.value[resource] = false
    }
  }

  return {
    standings,
    teamStatistics,
    loading,
    error,
    cacheAt,
    fetchStandings: (query: FifaQueryParams, force = false) => fetchResource('standings', force, () => api.getStandings(query, { bypassCache: force })),
    fetchTeamStatistics: (query: FifaQueryParams, force = false) => fetchResource('teamStatistics', force, () => api.getTeamStatistics(query, { bypassCache: force })),
  }
})
