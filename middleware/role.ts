const normalizeRoles = (roles: unknown): string[] => {
  if (!roles) {
    return []
  }

  if (Array.isArray(roles)) {
    return roles.filter(role => typeof role === 'string')
  }

  return typeof roles === 'string' ? [roles] : []
}

export default defineNuxtRouteMiddleware(async (to) => {
  const requiredRoles = normalizeRoles(to.meta.requiredRoles)

  if (requiredRoles.length === 0) {
    return
  }

  const { initSession } = useAuth()
  const { hasRole } = useAccessControl()

  await initSession()

  if (!hasRole(requiredRoles)) {
    return navigateTo({
      path: '/',
      query: {
        message: 'accessDenied',
      },
    })
  }
})
