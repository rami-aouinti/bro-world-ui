import { useFifaFixturesApi } from '~/composables/fifa/useFifaFixturesApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_FIXTURES_TTL_MS = 120_000

type FixturesResource = 'fixtures' | 'headtohead' | 'events' | 'lineups' | 'statistics' | 'players'

export const useFifaFixturesStore = defineStore('fifaFixtures', () => {
  const api = useFifaFixturesApi()

  const byResource = ref<Record<FixturesResource, unknown[]>>({
    fixtures: [],
    headtohead: [],
    events: [],
    lineups: [],
    statistics: [],
    players: [],
  })

  const loading = ref<Record<FixturesResource, boolean>>({
    fixtures: false,
    headtohead: false,
    events: false,
    lineups: false,
    statistics: false,
    players: false,
  })

  const error = ref<Record<FixturesResource, Error | null>>({
    fixtures: null,
    headtohead: null,
    events: null,
    lineups: null,
    statistics: null,
    players: null,
  })

  const cacheAt = ref<Record<FixturesResource, number>>({ fixtures: 0, headtohead: 0, events: 0, lineups: 0, statistics: 0, players: 0 })

  const isFresh = (resource: FixturesResource) => Date.now() - cacheAt.value[resource] < FIFA_FIXTURES_TTL_MS

  const fetchDomain = async (resource: FixturesResource, loader: () => Promise<{ items: unknown[] }>, force = false) => {
    if (!force && byResource.value[resource].length > 0 && isFresh(resource)) {
      return byResource.value[resource]
    }

    loading.value[resource] = true
    error.value[resource] = null
    try {
      const result = await loader()
      byResource.value[resource] = result.items
      cacheAt.value[resource] = Date.now()
      return byResource.value[resource]
    }
    catch (err) {
      error.value[resource] = err instanceof Error ? err : new Error(`Failed to fetch fixtures ${resource}`)
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
    cacheAt,
    fetchFixtures: (query: FifaQueryParams, force = false) => fetchDomain('fixtures', () => api.getFixtures(query, { bypassCache: force }), force),
    fetchHeadToHead: (query: FifaQueryParams, force = false) => fetchDomain('headtohead', () => api.getHeadToHead(query, { bypassCache: force }), force),
    fetchEvents: (query: FifaQueryParams, force = false) => fetchDomain('events', () => api.getEvents(query, { bypassCache: force }), force),
    fetchLineups: (query: FifaQueryParams, force = false) => fetchDomain('lineups', () => api.getLineups(query, { bypassCache: force }), force),
    fetchStatistics: (query: FifaQueryParams, force = false) => fetchDomain('statistics', () => api.getStatistics(query, { bypassCache: force }), force),
    fetchPlayers: (query: FifaQueryParams, force = false) => fetchDomain('players', () => api.getPlayers(query, { bypassCache: force }), force),
  }
})
