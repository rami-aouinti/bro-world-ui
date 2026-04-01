import { defineStore } from 'pinia'
import { useGameCatalogApi } from '~/composables/api/useGameCatalogApi'
import type { GameCategory } from '~/types/game'

export const useGameCatalogStore = defineStore('game-catalog', () => {
  const gameCatalogApi = useGameCatalogApi()

  const categories = ref<GameCategory[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchCatalog = async (force = false) => {
    if (categories.value.length > 0 && !force) {
      return categories.value
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await gameCatalogApi.getPublicGameCatalog()
      categories.value = Array.isArray(response) ? response : (response.items ?? [])
      return categories.value
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load game catalog.'
      categories.value = []
      return categories.value
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    categories,
    isLoading,
    error,
    fetchCatalog,
  }
})
