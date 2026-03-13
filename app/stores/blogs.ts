import { defineStore } from 'pinia'
import { useAuthSessionStore } from '~/stores/authSession'
import type { BlogComment, BlogPagination, BlogPost, BlogReaction, BlogWithPagination } from '~/types/api/blog'
import type { UUID } from '~/types/api/common'
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

type GeneralCacheKeyParts = {
  visibility: BlogVisibility
  page: number
  limit: number
}


type CreatePostPayload = {
  content?: string | null
  title?: string
  filePath?: string | null
  mediaUrls?: string[]
  sharedUrl?: string | null
  parentPostId?: string | null
  isPinned?: boolean
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
  const myPosts = ref<BlogWithPagination | null>(null)
  const myPostsPagination = ref<BlogPagination | null>(null)
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

  const parseGeneralCacheKey = (cacheKey: string): GeneralCacheKeyParts | null => {
    const parts = cacheKey.split(':')
    if (parts.length !== 4 || parts[0] !== 'general') {
      return null
    }

    const visibility = parts[1]
    if (visibility !== 'private' && visibility !== 'public') {
      return null
    }

    const page = Number(parts[2])
    const limit = Number(parts[3])
    if (!Number.isFinite(page) || !Number.isFinite(limit)) {
      return null
    }

    return {
      visibility,
      page,
      limit,
    }
  }
  const applyMutationToGeneralAndCache = (mutator: (blog: BlogWithPagination) => BlogWithPagination) => {
    if (general.value) {
      general.value = mutator(general.value)
      generalPagination.value = general.value.pagination ?? generalPagination.value
    }

    const now = Date.now()
    for (const [cacheKey, cacheEntry] of Object.entries(cache.value)) {
      if (!cacheKey.startsWith('general:')) {
        continue
      }

      cache.value[cacheKey] = {
        ...cacheEntry,
        data: mutator(cacheEntry.data),
        cachedAt: now,
      }
    }
  }

  const appendToParentComment = (comments: BlogComment[], parentCommentId: string, newComment: BlogComment): BlogComment[] => comments.map((comment) => {
    if (comment.id === parentCommentId) {
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
      children: appendToParentComment(comment.children, parentCommentId, newComment),
    }
  })

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

  const removeCommentFromTree = (comments: BlogComment[], commentId: string): BlogComment[] => comments
    .filter(comment => comment.id !== commentId)
    .map(comment => ({
      ...comment,
      children: removeCommentFromTree(comment.children, commentId),
    }))

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

  const addRootPostToStore = (payload: CreatePostPayload, postId?: UUID) => {
    const nowIso = new Date().toISOString()
    const newPost: BlogPost = {
      id: postId ?? postTempId(),
      slug: undefined,
      authorId: authSession.profile?.id ?? postTempId(),
      isAuthor: true,
      author: currentAuthor(),
      title: payload.title,
      content: payload.content ?? null,
      sharedUrl: payload.sharedUrl ?? null,
      mediaUrls: payload.mediaUrls ?? [],
      parent: null,
      filePath: payload.filePath ?? null,
      createdAt: nowIso,
      reactions: [],
      comments: [],
      children: {
        count: 0,
        authors: [],
      },
    }

    applyMutationToGeneralAndCache((blog) => {
      const nextPosts = [newPost, ...blog.posts]
      const pagination = blog.pagination
        ? {
            ...blog.pagination,
            totalItems: blog.pagination.totalItems + 1,
            totalPages: Math.max(1, Math.ceil((blog.pagination.totalItems + 1) / blog.pagination.limit)),
          }
        : blog.pagination

      return {
        ...blog,
        posts: nextPosts,
        pagination,
      }
    })

    for (const [cacheKey, cacheEntry] of Object.entries(cache.value)) {
      const parts = parseGeneralCacheKey(cacheKey)
      if (!parts || parts.visibility !== 'private' || parts.page !== 1) {
        continue
      }

      cache.value[cacheKey] = {
        ...cacheEntry,
        data: {
          ...cacheEntry.data,
          posts: [newPost, ...cacheEntry.data.posts].slice(0, parts.limit),
        },
        cachedAt: Date.now(),
      }
    }

    if (currentGeneralVisibility.value === 'private' && lastPrivateGeneralQuery.value.page === 1 && general.value) {
      general.value = {
        ...general.value,
        posts: general.value.posts.slice(0, lastPrivateGeneralQuery.value.limit),
      }
    }
  }

  const updatePostInStore = (postId: string, updater: (post: BlogPost) => BlogPost) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => post.id === postId ? updater(post) : post),
    }))
  }

  const deletePostFromStore = (postId: string) => {
    applyMutationToGeneralAndCache((blog) => {
      const hadPost = blog.posts.some(post => post.id === postId)
      const pagination = hadPost && blog.pagination
        ? {
            ...blog.pagination,
            totalItems: Math.max(0, blog.pagination.totalItems - 1),
            totalPages: Math.max(1, Math.ceil(Math.max(0, blog.pagination.totalItems - 1) / blog.pagination.limit)),
          }
        : blog.pagination

      return {
        ...blog,
        posts: blog.posts.filter(post => post.id !== postId),
        pagination,
      }
    })
  }

  const addCommentToStore = (postId: string, payload: { content: string, parentCommentId: string | null, filePath?: string | null }, commentId?: UUID) => {
    const now = new Date().toISOString()
    const newComment: BlogComment = {
      id: commentId ?? commentTempId(),
      authorId: authSession.profile?.id ?? commentTempId(),
      isAuthor: true,
      author: currentAuthor(),
      content: payload.content,
      filePath: payload.filePath ?? null,
      createdAt: now,
      reactions: [],
      children: [],
    }

    updatePostInStore(postId, (post) => {
      if (!payload.parentCommentId) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        }
      }

      return {
        ...post,
        comments: appendToParentComment(post.comments, payload.parentCommentId, newComment),
      }
    })
  }

  const updateCommentInStore = (commentId: string, payload: { content: string }) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => ({
        ...post,
        comments: updateCommentTree(post.comments, commentId, comment => ({
          ...comment,
          content: payload.content,
        })),
      })),
    }))
  }

  const deleteCommentFromStore = (commentId: string) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => ({
        ...post,
        comments: removeCommentFromTree(post.comments, commentId),
      })),
    }))
  }

  const addPostReactionToStore = (postId: string, type: string, reactionId?: UUID) => {
    updatePostInStore(postId, post => ({
      ...post,
      reactions: replaceOwnReaction(post.reactions ?? [], type).map(reaction =>
        reaction.isAuthor
          ? { ...reaction, id: reactionId ?? reaction.id }
          : reaction),
    }))
  }

  const addCommentReactionToStore = (commentId: string, type: string, reactionId?: UUID) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => ({
        ...post,
        comments: updateCommentTree(post.comments, commentId, comment => ({
          ...comment,
          reactions: replaceOwnReaction(comment.reactions ?? [], type).map(reaction =>
            reaction.isAuthor
              ? { ...reaction, id: reactionId ?? reaction.id }
              : reaction),
        })),
      })),
    }))
  }

  const deleteReactionFromStore = (reactionId: string) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => ({
        ...post,
        reactions: (post.reactions ?? []).filter(reaction => reaction.id !== reactionId),
        comments: post.comments.map(comment => ({
          ...comment,
          reactions: comment.reactions.filter(reaction => reaction.id !== reactionId),
          children: removeReactionFromCommentChildren(comment.children, reactionId),
        })),
      })),
    }))
  }

  const removeReactionFromCommentChildren = (comments: BlogComment[], reactionId: string): BlogComment[] => comments.map(comment => ({
    ...comment,
    reactions: comment.reactions.filter(reaction => reaction.id !== reactionId),
    children: removeReactionFromCommentChildren(comment.children, reactionId),
  }))

  const updateReactionInStore = (reactionId: string, payload: { type: string }) => {
    applyMutationToGeneralAndCache(blog => ({
      ...blog,
      posts: blog.posts.map(post => ({
        ...post,
        reactions: (post.reactions ?? []).map(reaction => reaction.id === reactionId ? { ...reaction, type: payload.type } : reaction),
        comments: updateReactionInCommentTree(post.comments, reactionId, payload.type),
      })),
    }))
  }

  const updateReactionInCommentTree = (comments: BlogComment[], reactionId: string, type: string): BlogComment[] => comments.map(comment => ({
    ...comment,
    reactions: comment.reactions.map(reaction => reaction.id === reactionId ? { ...reaction, type } : reaction),
    children: updateReactionInCommentTree(comment.children, reactionId, type),
  }))

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

  const fetchMyPosts = async (
    forceRefresh = false,
    options?: { page?: number, limit?: number, append?: boolean },
  ) => {
    const page = options?.page ?? 1
    const limit = options?.limit ?? DEFAULT_BLOG_PAGE_LIMIT
    const append = options?.append ?? page > 1

    const cacheKey = `mine:${page}:${limit}`
    const now = Date.now()
    const cacheEntry = cache.value[cacheKey]

    if (!forceRefresh && cacheEntry && now - cacheEntry.cachedAt < BLOG_CACHE_TTL_MS) {
      if (append) {
        myPosts.value = mergeGeneralPosts(myPosts.value, cacheEntry.data)
      }
      else {
        myPosts.value = cacheEntry.data
      }

      myPostsPagination.value = cacheEntry.data.pagination ?? null
      return myPosts.value
    }

    if (append) {
      isLoadingMore.value = true
    }
    else {
      isLoading.value = true
    }

    try {
      const response = await blogsApi.getMyPosts({ page, limit })
      myPosts.value = append ? mergeGeneralPosts(myPosts.value, response) : response
      myPostsPagination.value = response.pagination ?? null
      cache.value[cacheKey] = {
        data: response,
        cachedAt: now,
      }

      return myPosts.value
    }
    finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  const fetchNextMyPostsPage = async (limit = DEFAULT_BLOG_PAGE_LIMIT) => {
    if (!myPostsPagination.value) {
      return fetchMyPosts(false, { page: 1, limit, append: false })
    }

    if (isLoadingMore.value || myPostsPagination.value.page >= myPostsPagination.value.totalPages) {
      return myPosts.value
    }

    return fetchMyPosts(false, {
      page: myPostsPagination.value.page + 1,
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
      .filter(key => key.startsWith('general:') || key.startsWith('mine:'))
      .forEach((key) => {
        delete cache.value[key]
      })

    generalPagination.value = null
    myPostsPagination.value = null
  }

  const createPost = async (blogId: string, payload: CreatePostPayload) => {
    const response = await blogsApi.createPost(blogId, payload)

    if (response?.status === 'accepted') {
      addRootPostToStore(payload, response.id)
      invalidateGeneralCache()
    }
  }

  const updatePost = async (postId: string, payload: { content?: string, filePath?: string | null }) => {
    await blogsApi.updatePost(postId, payload)

    updatePostInStore(postId, post => ({
      ...post,
      content: payload.content ?? post.content,
      filePath: payload.filePath === undefined ? post.filePath : payload.filePath,
    }))
    invalidateGeneralCache()
  }

  const deletePost = async (postId: string) => {
    await blogsApi.deletePost(postId)
    deletePostFromStore(postId)
    invalidateGeneralCache()
  }

  const createPostReaction = async (postId: string, payload: { type: string }) => {
    const response = await blogsApi.createPostReaction(postId, payload)

    if (response?.status === 'accepted') {
      addPostReactionToStore(postId, payload.type, response.id)
      invalidateGeneralCache()
    }
  }

  const createComment = async (postId: string, payload: { content: string, parentCommentId: string | null, filePath?: string | null }) => {
    const response = await blogsApi.createComment(postId, payload)

    if (response?.status === 'accepted') {
      addCommentToStore(postId, payload, response.id)
      invalidateGeneralCache()
    }
  }

  const updateComment = async (commentId: string, payload: { content: string }) => {
    await blogsApi.updateComment(commentId, payload)
    updateCommentInStore(commentId, payload)
    invalidateGeneralCache()
  }

  const deleteComment = async (commentId: string) => {
    await blogsApi.deleteComment(commentId)
    deleteCommentFromStore(commentId)
    invalidateGeneralCache()
  }

  const createReaction = async (commentId: string, payload: { type: string }) => {
    const response = await blogsApi.createReaction(commentId, payload)

    if (response?.status === 'accepted') {
      addCommentReactionToStore(commentId, payload.type, response.id)
      invalidateGeneralCache()
    }
  }

  const deleteReaction = async (reactionId: string) => {
    await blogsApi.deleteReaction(reactionId)
    deleteReactionFromStore(reactionId)
    invalidateGeneralCache()
  }

  const updateReaction = async (reactionId: string, payload: { type: string }) => {
    await blogsApi.updateReaction(reactionId, payload)
    updateReactionInStore(reactionId, payload)
    invalidateGeneralCache()
  }

  return {
    general,
    generalPagination,
    myPosts,
    myPostsPagination,
    isLoading,
    isLoadingMore,
    reactionTypes,
    fetchGeneral,
    fetchNextGeneralPage,
    fetchMyPosts,
    fetchNextMyPostsPage,
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
