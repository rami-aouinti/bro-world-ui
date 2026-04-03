import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaPlayersApi = () => {
  const getPlayers = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('players', query, options)
  const getSquads = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('players/squads', query, options)
  const getTransfers = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('transfers', query, options)
  const getTrophies = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('trophies', query, options)
  const getSidelined = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('sidelined', query, options)
  const getInjuries = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('injuries', query, options)
  const getCoachs = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('coachs', query, options)

  return {
    getPlayers,
    getSquads,
    getTransfers,
    getTrophies,
    getSidelined,
    getInjuries,
    getCoachs,
  }
}
