import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaReferenceApi = () => {
  const getTimezone = (options?: FifaFetchOptions) => fetchFifaFamilyEndpoint<string>('timezone', undefined, options)
  const getCountries = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('countries', query, options)
  const getLeagues = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('leagues', query, options)
  const getSeasons = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('leagues/seasons', query, options)

  return {
    getTimezone,
    getCountries,
    getLeagues,
    getSeasons,
  }
}
