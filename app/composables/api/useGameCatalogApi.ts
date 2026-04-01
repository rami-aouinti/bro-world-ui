import { useApiClient } from '../useApiClient'
import type { GameCategory } from '~/types/game'

type GameCatalogResponse = GameCategory[] | { items?: GameCategory[] }

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
