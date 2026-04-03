import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaStandingsApi = () => {
  const getStandings = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('standings', query, options)
  const getTeamStatistics = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('teams/statistics', query, options)

  return {
    getStandings,
    getTeamStatistics,
  }
}
