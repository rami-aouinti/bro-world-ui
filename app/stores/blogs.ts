import { defineStore } from 'pinia'
import type { BlogPagination, BlogRead, BlogWithPagination } from '~/types/api/blog'
import { BLOG_REACTION_FALLBACK_TYPES } from '~/constants/blogReactions'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

type BlogVisibility = 'public' | 'private'

type BlogCacheEntry = {
  data: BlogWithPagination
  cachedAt: number
}

const BLOG_CACHE_TTL_MS = 60_000
const DEFAULT_BLOG_PAGE_LIMIT = 5

type BlogListQuery = {
  page: number
  limit: number
}

export const useBlogsStore = defineStore('blogs', () => {
  const blogsApi = useBlogsApi()

  const general = ref<BlogWithPagination | null>(null)
  const generalPagination = ref<BlogPagination | null>(null)
  const cache = ref<Record<string, BlogCacheEntry>>({})
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const currentGeneralVisibility = ref<BlogVisibility>('private')
  const lastPrivateGeneralQuery = ref<BlogListQuery>({ page: 1, limit: DEFAULT_BLOG_PAGE_LIMIT })
  const reactionTypes = ref<string[]>([...BLOG_REACTION_FALLBACK_TYPES])

  const mergeGeneralPosts = (currentBlog: BlogWithPagination | null, incomingBlog: BlogWithPagination) => {
    if (!currentBlog) {
      return incomingBlog
    }

    const knownPostIds = new Set(currentBlog.posts.map(post => post.id))
    const nextPosts = [...currentBlog.posts]

    for (const post of incomingBlog.posts) {
      if (!knownPostIds.has(post.id)) {
        nextPosts.push(post)
      }
    }

    return {
      ...incomingBlog,
      posts: nextPosts,
    }
  }

  const fetchGeneral = async (
    forceRefresh = false,
    isPublic = false,
    options?: { page?: number, limit?: number, append?: boolean },
  ) => {
    const visibility: BlogVisibility = isPublic ? 'public' : 'private'
    currentGeneralVisibility.value = visibility

    const page = options?.page ?? 1
    const limit = options?.limit ?? DEFAULT_BLOG_PAGE_LIMIT
    const append = options?.append ?? page > 1

    if (visibility === 'private') {
      lastPrivateGeneralQuery.value = { page, limit }
    }

    const cacheKey = `general:${visibility}:${page}:${limit}`
    const now = Date.now()
    const cacheEntry = cache.value[cacheKey]

    if (!forceRefresh && cacheEntry && now - cacheEntry.cachedAt < BLOG_CACHE_TTL_MS) {
      if (append) {
        general.value = mergeGeneralPosts(general.value, cacheEntry.data)
      }
      else {
        general.value = cacheEntry.data
      }

      generalPagination.value = cacheEntry.data.pagination ?? null
      return general.value
    }

    if (append) {
      isLoadingMore.value = true
    }
    else {
      isLoading.value = true
    }

    try {
      const response = await blogsApi.getGeneral(isPublic, { page, limit })
      general.value = append ? mergeGeneralPosts(general.value, response) : response
      generalPagination.value = response.pagination ?? null
      cache.value[cacheKey] = {
        data: response,
        cachedAt: now,
      }

      return general.value
    }
    finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  const fetchNextGeneralPage = async (isPublic = false, limit = DEFAULT_BLOG_PAGE_LIMIT) => {
    if (!generalPagination.value) {
      return fetchGeneral(false, isPublic, { page: 1, limit, append: false })
    }

    if (isLoadingMore.value || generalPagination.value.page >= generalPagination.value.totalPages) {
      return general.value
    }

    return fetchGeneral(false, isPublic, {
      page: generalPagination.value.page + 1,
      limit,
      append: true,
    })
  }

  const fetchReactionTypes = async () => {
    try {
      const response = await blogsApi.getReactionTypes()
      reactionTypes.value = response.items?.length ? response.items : [...BLOG_REACTION_FALLBACK_TYPES]
      return reactionTypes.value
    }
    catch {
      reactionTypes.value = [...BLOG_REACTION_FALLBACK_TYPES]
      return reactionTypes.value
    }
  }

  const invalidateGeneralCache = () => {
    Object.keys(cache.value)
      .filter(key => key.startsWith('general:'))
      .forEach((key) => {
        delete cache.value[key]
      })

    generalPagination.value = null
  }

  const refreshGeneralInBackground = () => {
    invalidateGeneralCache()
    void fetchGeneral(true, currentGeneralVisibility.value === 'public', {
      page: 1,
      limit: DEFAULT_BLOG_PAGE_LIMIT,
      append: false,
    }).catch((error) => {
      console.error('Failed to refresh general blog in background.', error)
    })
  }

  const invalidatePrivateCacheForPagination = (query: BlogListQuery) => {
    delete cache.value[`general:private:${query.page}:${query.limit}`]

    if (currentGeneralVisibility.value === 'private') {
      generalPagination.value = null
    }
  }

  const refreshPrivateGeneralInBackground = (query: BlogListQuery) => {
    invalidatePrivateCacheForPagination(query)
    void fetchGeneral(true, false, {
      page: query.page,
      limit: query.limit,
      append: false,
    }).catch((error) => {
      console.error('Failed to refresh private general blog in background.', error)
    })
  }

  const refreshPrivateGeneralOnAccepted = (response: { status?: string }) => {
    if (response?.status !== 'accepted') {
      return
    }

    refreshPrivateGeneralInBackground(lastPrivateGeneralQuery.value)
  }

  const createPost = async (blogId: string, payload: { content: string, filePath?: string | null }) => {
    const response = await blogsApi.createPost(blogId, payload)
    refreshPrivateGeneralOnAccepted(response)
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
    const response = await blogsApi.createPostReaction(postId, payload)
    refreshPrivateGeneralOnAccepted(response)
  }

  const createComment = async (postId: string, payload: { content: string, parentCommentId: string | null }) => {
    const response = await blogsApi.createComment(postId, payload)
    refreshPrivateGeneralOnAccepted(response)
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
    const response = await blogsApi.createReaction(commentId, payload)
    refreshPrivateGeneralOnAccepted(response)
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
    generalPagination,
    isLoading,
    isLoadingMore,
    reactionTypes,
    fetchGeneral,
    fetchNextGeneralPage,
    fetchReactionTypes,
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
