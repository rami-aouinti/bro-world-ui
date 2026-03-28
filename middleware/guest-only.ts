export default defineNuxtRouteMiddleware(async () => {
  // Évite les 500 SSR sur /login et /register:
  // la vérification de session se fait côté client uniquement.
  if (import.meta.server) {
    return
  }

  const { initialized, initSession, isAuthenticated } = useAuth()

  if (!initialized.value) {
    await initSession()
  }

  if (isAuthenticated.value) {
    return navigateTo('/', { replace: true })
  }
})
