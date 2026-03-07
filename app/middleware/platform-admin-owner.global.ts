export default defineNuxtRouteMiddleware(async (to) => {
  const match = to.path.match(/^\/platform\/([^/]+)\/([^/]+)\/admin(?:\/.*)?$/)

  if (!match) {
    return
  }

  const slug = decodeURIComponent(match[1] ?? '')
  const domain = match[2] ?? ''
  const platformPermissions = usePlatformPermissions(slug)

  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    return navigateTo(platformPermissions.getDeniedRedirectPath(domain))
  }
})
