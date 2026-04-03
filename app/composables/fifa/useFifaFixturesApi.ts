import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaFixturesApi = () => {
  const getFixtures = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures', query, options)
  const getHeadToHead = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures/headtohead', query, options)
  const getEvents = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures/events', query, options)
  const getLineups = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures/lineups', query, options)
  const getStatistics = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures/statistics', query, options)
  const getPlayers = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('fixtures/players', query, options)

  return {
    getFixtures,
    getHeadToHead,
    getEvents,
    getLineups,
    getStatistics,
    getPlayers,
  }
}
