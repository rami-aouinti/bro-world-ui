import { defineStore } from 'pinia'
import type { BlogRead } from '~/types/api/blog'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

type BlogCacheEntry = {
  data: BlogRead
  cachedAt: number
}

const BLOG_CACHE_TTL_MS = 60_000

export const useBlogsStore = defineStore('blogs', () => {
  const blogsApi = useBlogsApi()

  const general = ref<BlogRead | null>(null)
  const cache = ref<Record<string, BlogCacheEntry>>({})
  const isLoading = ref(false)

  const fetchGeneral = async (forceRefresh = false) => {
    const cacheKey = 'general'
    const now = Date.now()
    const cacheEntry = cache.value[cacheKey]

    if (!forceRefresh && cacheEntry && now - cacheEntry.cachedAt < BLOG_CACHE_TTL_MS) {
      general.value = cacheEntry.data
      return general.value
    }

    isLoading.value = true

    try {
      const response = await blogsApi.getGeneral()
      general.value = response
      cache.value[cacheKey] = {
        data: response,
        cachedAt: now,
      }

      return response
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    general,
    isLoading,
    fetchGeneral,
  }
})
