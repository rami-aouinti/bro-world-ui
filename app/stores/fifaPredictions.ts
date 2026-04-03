import { useFifaPredictionsApi } from '~/composables/fifa/useFifaPredictionsApi'
import type { FifaQueryParams } from '~/composables/fifa/types'

const FIFA_PREDICTIONS_TTL_MS = 60_000

export const useFifaPredictionsStore = defineStore('fifaPredictions', () => {
  const api = useFifaPredictionsApi()

  const predictions = ref<unknown[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdatedAt = ref(0)

  const isFresh = () => Date.now() - lastUpdatedAt.value < FIFA_PREDICTIONS_TTL_MS

  const fetchPredictions = async (query: FifaQueryParams, force = false) => {
    if (!force && predictions.value.length > 0 && isFresh()) {
      return predictions.value
    }

    loading.value = true
    error.value = null
    try {
      const result = await api.getPredictions(query, { bypassCache: force })
      predictions.value = result.items
      lastUpdatedAt.value = Date.now()
      return predictions.value
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch predictions')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    predictions,
    loading,
    error,
    lastUpdatedAt,
    fetchPredictions,
  }
})
