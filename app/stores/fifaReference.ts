import { useFifaReferenceApi } from '~/composables/fifa/useFifaReferenceApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_REFERENCE_TTL_MS = 86_400_000

type ReferenceResource = 'timezone' | 'countries' | 'leagues' | 'seasons'

export const useFifaReferenceStore = defineStore('fifaReference', () => {
  const api = useFifaReferenceApi()

  const timezone = ref<string[]>([])
  const countries = ref<unknown[]>([])
  const leagues = ref<unknown[]>([])
  const seasons = ref<unknown[]>([])

  const loading = ref<Record<ReferenceResource, boolean>>({ timezone: false, countries: false, leagues: false, seasons: false })
  const error = ref<Record<ReferenceResource, Error | null>>({ timezone: null, countries: null, leagues: null, seasons: null })
  const lastUpdatedAt = ref<Record<ReferenceResource, number>>({ timezone: 0, countries: 0, leagues: 0, seasons: 0 })

  const isFresh = (resource: ReferenceResource) => Date.now() - lastUpdatedAt.value[resource] < FIFA_REFERENCE_TTL_MS

  const fetchResource = async <T>(
    resource: ReferenceResource,
    loader: () => Promise<{ items: T[] }>,
    target: Ref<T[]>,
    force = false,
  ) => {
    if (!force && target.value.length > 0 && isFresh(resource)) {
      return target.value
    }

    loading.value[resource] = true
    error.value[resource] = null
    try {
      const result = await loader()
      target.value = result.items
      lastUpdatedAt.value[resource] = Date.now()
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

  const fetchTimezone = (force = false) => fetchResource('timezone', () => api.getTimezone({ bypassCache: force }), timezone, force)
  const fetchCountries = (query: FifaQueryParams = {}, force = false) => fetchResource('countries', () => api.getCountries(query, { bypassCache: force }), countries, force)
  const fetchLeagues = (query: FifaQueryParams = {}, force = false) => fetchResource('leagues', () => api.getLeagues(query, { bypassCache: force }), leagues, force)
  const fetchSeasons = (query: FifaQueryParams = {}, force = false) => fetchResource('seasons', () => api.getSeasons(query, { bypassCache: force }), seasons, force)

  return {
    timezone,
    countries,
    leagues,
    seasons,
    loading,
    error,
    lastUpdatedAt,
    fetchTimezone,
    fetchCountries,
    fetchLeagues,
    fetchSeasons,
  }
})
