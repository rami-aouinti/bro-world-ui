import { useFifaOddsApi } from '~/composables/fifa/useFifaOddsApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_ODDS_TTL_MS = 60_000

type OddsResource = 'odds' | 'live' | 'bookmakers' | 'bets' | 'liveBets'

export const useFifaOddsStore = defineStore('fifaOdds', () => {
  const api = useFifaOddsApi()

  const byResource = ref<Record<OddsResource, unknown[]>>({
    odds: [], live: [], bookmakers: [], bets: [], liveBets: [],
  })
  const loading = ref<Record<OddsResource, boolean>>({
    odds: false, live: false, bookmakers: false, bets: false, liveBets: false,
  })
  const error = ref<Record<OddsResource, Error | null>>({
    odds: null, live: null, bookmakers: null, bets: null, liveBets: null,
  })
  const lastPaging = ref<Record<OddsResource, { current: number, total: number } | null>>({
    odds: null, live: null, bookmakers: null, bets: null, liveBets: null,
  })

  const fetchResource = async (resource: OddsResource, loader: () => Promise<{ items: unknown[] }>) => {
    loading.value[resource] = true
    error.value[resource] = null
    try {
      const result = await loader()
      byResource.value[resource] = result.items
      lastPaging.value[resource] = result.paging
      return byResource.value[resource]
    }
    catch (err) {
      error.value[resource] = err instanceof Error ? err : new Error(`Failed to fetch odds ${resource}`)
      throw err
    }
    finally {
      loading.value[resource] = false
    }
  }

  return {
    byResource,
    loading,
    error,
    lastPaging,
    cacheTtlMs: FIFA_ODDS_TTL_MS,
    fetchOdds: (query: FifaQueryParams = {}) => fetchResource('odds', () => api.getOdds(query)),
    fetchLiveOdds: (query: FifaQueryParams = {}) => fetchResource('live', () => api.getLiveOdds(query)),
    fetchBookmakers: (query: FifaQueryParams = {}) => fetchResource('bookmakers', () => api.getBookmakers(query)),
    fetchBets: (query: FifaQueryParams = {}) => fetchResource('bets', () => api.getBets(query)),
    fetchLiveBets: (query: FifaQueryParams = {}) => fetchResource('liveBets', () => api.getLiveBets(query)),
  }
})
