export default defineNuxtRouteMiddleware(async (to) => {
  const { initSession, isAuthenticated } = useAuth()

  await initSession()

  const isPublicRoute = to.meta.public === true
  const requiresAuth = to.meta.requiresAuth !== false && !isPublicRoute

  if (requiresAuth && !isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
        message: 'authRequired',
      },
    })
  }
})
