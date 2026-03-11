import { defineStore } from 'pinia'
import { useAuthSessionStore } from '~/stores/authSession'
import type { BlogComment, BlogPagination, BlogPost, BlogRead, BlogReaction, BlogWithPagination } from '~/types/api/blog'
import { BLOG_REACTION_FALLBACK_TYPES } from '~/constants/blogReactions'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

type BlogVisibility = 'public' | 'private'

type BlogCacheEntry = {
  data: BlogWithPagination
  cachedAt: number
}

const BLOG_CACHE_TTL_MS = 60_000
const DEFAULT_BLOG_PAGE_LIMIT = 5
const PRIVATE_CACHE_PAGE_INVALIDATION_BUFFER = 2

type BlogListQuery = {
  page: number
  limit: number
}

export const useBlogsStore = defineStore('blogs', () => {
  const blogsApi = useBlogsApi()
  const authSession = useAuthSessionStore()

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

  const postTempId = () => `temp-post-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const commentTempId = () => `temp-comment-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const reactionTempId = () => `temp-reaction-${Date.now()}-${Math.random().toString(16).slice(2)}`

  const currentAuthor = () => ({
    firstName: authSession.profile?.firstName ?? 'Unknown',
    lastName: authSession.profile?.lastName ?? 'User',
    username: authSession.profile?.username,
    photo: authSession.profile?.photo ?? null,
  })

  const addRootPostToStore = (payload: { content: string, filePath?: string | null }) => {
    if (!general.value) {
      return
    }

    const now = new Date().toISOString()
    const newPost: BlogPost = {
      id: postTempId(),
      authorId: authSession.profile?.id ?? postTempId(),
      isAuthor: true,
      author: currentAuthor(),
      content: payload.content,
      filePath: payload.filePath ?? null,
      createdAt: now,
      reactions: [],
      comments: [],
    }

    general.value = {
      ...general.value,
      posts: [newPost, ...general.value.posts],
    }

    if (generalPagination.value) {
      generalPagination.value = {
        ...generalPagination.value,
        totalItems: generalPagination.value.totalItems + 1,
      }
    }
  }

  const updatePostInStore = (postId: string, updater: (post: BlogPost) => BlogPost) => {
    if (!general.value) {
      return
    }

    general.value = {
      ...general.value,
      posts: general.value.posts.map(post => post.id === postId ? updater(post) : post),
    }
  }

  const addCommentToStore = (postId: string, payload: { content: string, parentCommentId: string | null }) => {
    const now = new Date().toISOString()
    const newComment: BlogComment = {
      id: commentTempId(),
      authorId: authSession.profile?.id ?? commentTempId(),
      isAuthor: true,
      author: currentAuthor(),
      content: payload.content,
      filePath: null,
      createdAt: now,
      reactions: [],
      children: [],
    }

    const appendToParent = (comments: BlogComment[]): BlogComment[] => comments.map((comment) => {
      if (comment.id === payload.parentCommentId) {
        return {
          ...comment,
          children: [...comment.children, newComment],
        }
      }

      if (!comment.children.length) {
        return comment
      }

      return {
        ...comment,
        children: appendToParent(comment.children),
      }
    })

    updatePostInStore(postId, (post) => {
      if (!payload.parentCommentId) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        }
      }

      return {
        ...post,
        comments: appendToParent(post.comments),
      }
    })
  }

  const replaceOwnReaction = (reactions: BlogReaction[] = [], type: string): BlogReaction[] => {
    const otherReactions = reactions.filter(reaction => !reaction.isAuthor)
    const ownExistingReaction = reactions.find(reaction => reaction.isAuthor)

    return [...otherReactions, {
      id: ownExistingReaction?.id ?? reactionTempId(),
      authorId: authSession.profile?.id ?? reactionTempId(),
      isAuthor: true,
      author: currentAuthor(),
      type,
      createdAt: new Date().toISOString(),
    }]
  }

  const updateCommentTree = (comments: BlogComment[], commentId: string, updater: (comment: BlogComment) => BlogComment): BlogComment[] => comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment)
    }

    if (!comment.children.length) {
      return comment
    }

    return {
      ...comment,
      children: updateCommentTree(comment.children, commentId, updater),
    }
  })

  const addPostReactionToStore = (postId: string, type: string) => {
    updatePostInStore(postId, post => ({
      ...post,
      reactions: replaceOwnReaction(post.reactions ?? [], type),
    }))
  }

  const addCommentReactionToStore = (commentId: string, type: string) => {
    if (!general.value) {
      return
    }

    general.value = {
      ...general.value,
      posts: general.value.posts.map(post => ({
        ...post,
        comments: updateCommentTree(post.comments, commentId, comment => ({
          ...comment,
          reactions: replaceOwnReaction(comment.reactions ?? [], type),
        })),
      })),
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
    const lastPageToInvalidate = query.page + PRIVATE_CACHE_PAGE_INVALIDATION_BUFFER

    for (let page = 1; page <= lastPageToInvalidate; page += 1) {
      delete cache.value[`general:private:${page}:${query.limit}`]
    }

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

    if (response?.status === 'accepted') {
      addRootPostToStore(payload)
    }

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

    if (response?.status === 'accepted') {
      addPostReactionToStore(postId, payload.type)
    }

    refreshPrivateGeneralOnAccepted(response)
  }

  const createComment = async (postId: string, payload: { content: string, parentCommentId: string | null }) => {
    const response = await blogsApi.createComment(postId, payload)

    if (response?.status === 'accepted') {
      addCommentToStore(postId, payload)
    }

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

    if (response?.status === 'accepted') {
      addCommentReactionToStore(commentId, payload.type)
    }

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
