import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaOddsApi = () => {
  const getOdds = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('odds', query, options)
  const getLiveOdds = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('odds/live', query, options)
  const getBookmakers = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('odds/bookmakers', query, options)
  const getBets = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('odds/bets', query, options)
  const getLiveBets = (query?: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('odds/live/bets', query, options)

  return {
    getOdds,
    getLiveOdds,
    getBookmakers,
    getBets,
    getLiveBets,
  }
}
