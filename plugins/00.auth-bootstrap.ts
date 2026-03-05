export default defineNuxtPlugin(async () => {
  const { initSession } = useAuth()

  await initSession()
})
