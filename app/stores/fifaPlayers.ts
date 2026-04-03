import { useFifaPlayersApi } from '~/composables/fifa/useFifaPlayersApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_PLAYERS_TTL_MS = 300_000

type PlayersResource = 'players' | 'squads' | 'transfers' | 'trophies' | 'sidelined' | 'injuries' | 'coachs'

export const useFifaPlayersStore = defineStore('fifaPlayers', () => {
  const api = useFifaPlayersApi()

  const byResource = ref<Record<PlayersResource, unknown[]>>({
    players: [], squads: [], transfers: [], trophies: [], sidelined: [], injuries: [], coachs: [],
  })
  const loading = ref<Record<PlayersResource, boolean>>({
    players: false, squads: false, transfers: false, trophies: false, sidelined: false, injuries: false, coachs: false,
  })
  const error = ref<Record<PlayersResource, Error | null>>({
    players: null, squads: null, transfers: null, trophies: null, sidelined: null, injuries: null, coachs: null,
  })
  const cacheAt = ref<Record<PlayersResource, number>>({
    players: 0, squads: 0, transfers: 0, trophies: 0, sidelined: 0, injuries: 0, coachs: 0,
  })

  const isFresh = (resource: PlayersResource) => Date.now() - cacheAt.value[resource] < FIFA_PLAYERS_TTL_MS

  const fetchResource = async (resource: PlayersResource, loader: () => Promise<{ items: unknown[] }>, force = false) => {
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
      error.value[resource] = err instanceof Error ? err : new Error(`Failed to fetch ${resource}`)
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
    fetchPlayers: (query: FifaQueryParams, force = false) => fetchResource('players', () => api.getPlayers(query, { bypassCache: force }), force),
    fetchSquads: (query: FifaQueryParams, force = false) => fetchResource('squads', () => api.getSquads(query, { bypassCache: force }), force),
    fetchTransfers: (query: FifaQueryParams, force = false) => fetchResource('transfers', () => api.getTransfers(query, { bypassCache: force }), force),
    fetchTrophies: (query: FifaQueryParams, force = false) => fetchResource('trophies', () => api.getTrophies(query, { bypassCache: force }), force),
    fetchSidelined: (query: FifaQueryParams, force = false) => fetchResource('sidelined', () => api.getSidelined(query, { bypassCache: force }), force),
    fetchInjuries: (query: FifaQueryParams = {}, force = false) => fetchResource('injuries', () => api.getInjuries(query, { bypassCache: force }), force),
    fetchCoachs: (query: FifaQueryParams, force = false) => fetchResource('coachs', () => api.getCoachs(query, { bypassCache: force }), force),
  }
})
