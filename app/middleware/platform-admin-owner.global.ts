export default defineNuxtRouteMiddleware(async (to) => {
  const match = to.path.match(/^\/platform\/([^/]+)\/([^/]+)\/admin(?:\/.*)?$/)

  if (!match) {
    return
  }

  const slug = decodeURIComponent(match[1] ?? '')
  const domain = match[2] ?? ''
  const { isOwner, resolveApplication } = usePlatformApplication(slug)

  await resolveApplication()

  if (!isOwner.value) {
    return navigateTo(`/platform/${slug}/${domain}/home`)
  }
})
