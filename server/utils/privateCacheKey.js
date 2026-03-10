const PRIVATE_CACHE_ROUTE_PREFIXES = [
  '/api/v1/users/me',
  '/api/v1/profile',
  '/api/v1/chat/private',
  '/api/v1/notifications',
]

export const isPrivateCacheRoute = (path) => PRIVATE_CACHE_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))

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

export const getPrivateResourceIdentifier = (path) => {
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

  if (path.startsWith('/api/v1/blogs/')) {
    const blogId = path.split('/').filter(Boolean)[3]
    return blogId ? `blog:${blogId}` : 'blog:list'
  }

  return 'resource'
}

export const canReadPrivateCache = (authUserId, cacheUserId) => Boolean(authUserId) && authUserId === cacheUserId
