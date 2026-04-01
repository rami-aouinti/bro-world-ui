import { useApiClient } from '../useApiClient'
import type { ApiGameCategory } from '~/types/game'

type GameCatalogResponse = ApiGameCategory[] | { items?: ApiGameCategory[] }

export const useGameCatalogApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getPublicGameCatalog() {
      return apiFetch<GameCatalogResponse>('/api/v1/public/game-catalog', {
        method: 'GET',
        skipAuthHeader: true,
      })
    },
  }
}
