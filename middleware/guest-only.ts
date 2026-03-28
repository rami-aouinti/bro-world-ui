export default defineNuxtRouteMiddleware(async () => {
  const { initialized, initSession, isAuthenticated } = useAuth()

  if (!initialized.value) {
    await initSession()
  }

  if (isAuthenticated.value) {
    return navigateTo('/', { replace: true })
  }
})
