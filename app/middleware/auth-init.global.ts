export default defineNuxtRouteMiddleware(async () => {
  const { initSession } = useAuth()

  await initSession()
})
