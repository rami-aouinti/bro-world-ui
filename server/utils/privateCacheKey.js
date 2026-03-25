import { createHash } from 'node:crypto'

const PRIVATE_BLOG_ROUTE_PREFIXES = [
  '/api/v1/private/blogs',
  '/api/v1/private/blog',
  '/api/v1/blogs/me',
]

const PRIVATE_CACHE_ROUTE_PREFIXES = [
  '/api/v1/users/me',
  '/api/v1/profile',
  '/api/v1/chat/private',
  '/api/v1/notifications',
  ...PRIVATE_BLOG_ROUTE_PREFIXES,
  '/api/v1/private/stories',
]

const BLOG_ENTITY_SEGMENTS = new Set(['blogs', 'blog', 'posts', 'post'])
const BLOG_SUB_RESOURCES = new Set(['comments', 'comment', 'reactions', 'reaction'])

const toPathSegments = (path = '') => path.split('/').filter(Boolean)

export const isPrivateBlogRoute = (path) => PRIVATE_BLOG_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))

export const isPrivateCacheRoute = (path) => isPrivateBlogRoute(path) || PRIVATE_CACHE_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))

export const getAuthUserIdFromProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return undefined
  }

  const candidate = profile.id ?? profile.userId
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate)
  }

  return undefined
}

export const buildFunctionalQuerySegment = (query = {}) => {
  const normalizedEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))

  if (!normalizedEntries.length) {
    return 'default'
  }

  return normalizedEntries
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&')
}

export const buildPrivateQueryHash = (query = {}) => createHash('sha256')
  .update(buildFunctionalQuerySegment(query))
  .digest('hex')
  .slice(0, 16)

const getPrivateBlogResourceIdentifier = (path) => {
  const segments = toPathSegments(path)

  if (segments[2] === 'blogs' && segments[3] === 'me') {
    return 'blog:me'
  }

  const privateBlogsIndex = segments.findIndex((segment, index) => segment === 'blogs' && segments[index - 1] === 'private')
  const privateBlogIndex = segments.findIndex((segment, index) => segment === 'blog' && segments[index - 1] === 'private')
  const entityIndex = segments.findIndex(segment => BLOG_ENTITY_SEGMENTS.has(segment))
  const blogIndex = privateBlogsIndex >= 0
    ? privateBlogsIndex
    : (privateBlogIndex >= 0 ? privateBlogIndex : entityIndex)

  if (blogIndex < 0) {
    return 'blog:list'
  }

  const postId = segments[blogIndex + 1]

  if (!postId || postId === 'application' || postId === 'general') {
    return 'blog:list'
  }

  const subResourceIndex = segments.findIndex((segment, index) => index > blogIndex && BLOG_SUB_RESOURCES.has(segment))

  if (subResourceIndex < 0) {
    return `blog:${postId}`
  }

  const subResource = segments[subResourceIndex].replace(/s$/, '')
  const subResourceId = segments[subResourceIndex + 1]

  return subResourceId
    ? `blog:${postId}:${subResource}:${subResourceId}`
    : `blog:${postId}:${subResource}`
}

export const getPrivateResourceIdentifier = (path) => {
  if (path.startsWith('/api/v1/users/me/applications/latest')) {
    return 'applications:latest'
  }

  if (path.startsWith('/api/v1/users/me/applications')) {
    return 'applications:list'
  }

  if (path.startsWith('/api/v1/users/me/friends/requests/sent')) {
    return 'friends:requests:sent'
  }

  if (path.startsWith('/api/v1/users/me/friends/requests')) {
    return 'friends:requests:incoming'
  }

  if (path.startsWith('/api/v1/users/me/friends/blocked')) {
    return 'friends:blocked'
  }

  if (path.startsWith('/api/v1/users/me/friends')) {
    return 'friends:list'
  }

  if (path.startsWith('/api/v1/chat/private/conversations')) {
    const conversationId = path.split('/').filter(Boolean)[5]
    return conversationId ? `conversation:${conversationId}` : 'conversation:list'
  }

  if (path.startsWith('/api/v1/notifications')) {
    return 'notifications'
  }

  if (path.startsWith('/api/v1/profile') || path.startsWith('/api/v1/users/me')) {
    return 'profile'
  }

  if (path.startsWith('/api/v1/private/stories')) {
    const storyId = path.split('/').filter(Boolean)[4]
    return storyId ? `story:${storyId}` : 'story:list'
  }

  if (isPrivateBlogRoute(path) || path.startsWith('/api/v1/blogs/')) {
    return getPrivateBlogResourceIdentifier(path)
  }

  return 'resource'
}

export const getPrivateResourceInvalidationPattern = (path) => {
  if (isPrivateBlogRoute(path) || path.startsWith('/api/v1/blogs/')) {
    return 'blog:*'
  }

  if (path.startsWith('/api/v1/private/stories')) {
    return 'story:*'
  }

  const identifier = getPrivateResourceIdentifier(path)
  return `${identifier}*`
}

export const canReadPrivateCache = (authUserId, cacheUserId) => Boolean(authUserId) && authUserId === cacheUserId
