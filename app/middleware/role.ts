const normalizeRequiredRoles = (roles: unknown): string[] => {
  if (!roles) {
    return []
  }

  return Array.isArray(roles) ? roles : [roles]
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { initSession, isAuthenticated } = useAuth()
  const authSession = useAuthSessionStore()

  await initSession()

  const requiredRoles = normalizeRequiredRoles(to.meta.requiredRoles)

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (requiredRoles.length === 0) {
    return
  }

  const hasAccess = requiredRoles.some(role => authSession.roles.includes(role))

  if (!hasAccess) {
    return navigateTo('/profile')
  }
})
