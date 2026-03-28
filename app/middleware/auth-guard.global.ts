const hasGuestOnlyMiddleware = (middlewareMeta: unknown) => {
  if (typeof middlewareMeta === 'string') {
    return middlewareMeta === 'guest-only'
  }

  if (Array.isArray(middlewareMeta)) {
    return middlewareMeta.includes('guest-only')
  }

  return false
}

export default defineNuxtRouteMiddleware(async (to) => {
  const requiresAuth = to.meta.requiresAuth === true
  const isPublicPage = to.meta.public === true
  const guestOnlyEnabled = hasGuestOnlyMiddleware(to.meta.middleware)
    || to.path === '/login'
    || to.path === '/register'

  // Comportement sûr par défaut: pas de redirection automatique sans méta explicite.
  if (!requiresAuth && !isPublicPage) {
    return
  }

  const { initialized, initSession, isAuthenticated } = useAuth()

  const shouldSkipServerGuestSessionInit = import.meta.server && guestOnlyEnabled && !requiresAuth

  if ((requiresAuth || guestOnlyEnabled) && !initialized.value && !shouldSkipServerGuestSessionInit) {
    await initSession()
  }

  if (requiresAuth && !isAuthenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
