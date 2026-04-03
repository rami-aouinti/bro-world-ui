import { fetchFifaFamilyEndpoint } from './fetcher'
import type { FifaFetchOptions, FifaQueryParams } from './types'

export const useFifaPredictionsApi = () => {
  const getPredictions = (query: FifaQueryParams, options?: FifaFetchOptions) => fetchFifaFamilyEndpoint('predictions', query, options)

  return {
    getPredictions,
  }
}
