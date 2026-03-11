import { defineStore } from 'pinia'
import type { BlogRead } from '~/types/api/blog'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

type BlogVisibility = 'public' | 'private'

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
  const currentGeneralVisibility = ref<BlogVisibility>('private')

  const fetchGeneral = async (forceRefresh = false, isPublic = false) => {
    const visibility: BlogVisibility = isPublic ? 'public' : 'private'
    currentGeneralVisibility.value = visibility
    const cacheKey = `general:${visibility}`
    const now = Date.now()
    const cacheEntry = cache.value[cacheKey]

    if (!forceRefresh && cacheEntry && now - cacheEntry.cachedAt < BLOG_CACHE_TTL_MS) {
      general.value = cacheEntry.data
      return general.value
    }

    isLoading.value = true

    try {
      const response = await blogsApi.getGeneral(isPublic)
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

  const invalidateGeneralCache = () => {
    Object.keys(cache.value)
      .filter(key => key.startsWith('general:'))
      .forEach((key) => {
        delete cache.value[key]
      })
  }

  const refreshGeneralInBackground = () => {
    invalidateGeneralCache()
    void fetchGeneral(true, currentGeneralVisibility.value === 'public').catch((error) => {
      console.error('Failed to refresh general blog in background.', error)
    })
  }

  const createPost = async (blogId: string, payload: { content: string, filePath?: string | null }) => {
    await blogsApi.createPost(blogId, payload)
    refreshGeneralInBackground()
  }

  const updatePost = async (postId: string, payload: { content?: string, filePath?: string | null }) => {
    await blogsApi.updatePost(postId, payload)
    refreshGeneralInBackground()
  }

  const deletePost = async (postId: string) => {
    await blogsApi.deletePost(postId)
    refreshGeneralInBackground()
  }


  const createPostReaction = async (postId: string, payload: { type: string }) => {
    await blogsApi.createPostReaction(postId, payload)
    refreshGeneralInBackground()
  }

  const createComment = async (postId: string, payload: { content: string, parentCommentId: string | null }) => {
    await blogsApi.createComment(postId, payload)
    refreshGeneralInBackground()
  }

  const updateComment = async (commentId: string, payload: { content: string }) => {
    await blogsApi.updateComment(commentId, payload)
    refreshGeneralInBackground()
  }

  const deleteComment = async (commentId: string) => {
    await blogsApi.deleteComment(commentId)
    refreshGeneralInBackground()
  }

  const createReaction = async (commentId: string, payload: { type: string }) => {
    await blogsApi.createReaction(commentId, payload)
    refreshGeneralInBackground()
  }

  const deleteReaction = async (reactionId: string) => {
    await blogsApi.deleteReaction(reactionId)
    refreshGeneralInBackground()
  }

  const updateReaction = async (reactionId: string, payload: { type: string }) => {
    await blogsApi.updateReaction(reactionId, payload)
    refreshGeneralInBackground()
  }

  return {
    general,
    isLoading,
    fetchGeneral,
    invalidateGeneralCache,
    createPost,
    updatePost,
    deletePost,
    createPostReaction,
    createComment,
    updateComment,
    deleteComment,
    createReaction,
    deleteReaction,
    updateReaction,
  }
})
