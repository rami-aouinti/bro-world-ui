export default defineNuxtRouteMiddleware(async (to) => {
  const slugParam = to.params?.slug
  const slug = decodeURIComponent(Array.isArray(slugParam) ? String(slugParam[0] ?? '') : String(slugParam ?? ''))
  const requiresPlatformAdmin = to.meta?.requiresPlatformAdmin === true
  const platformDomainMeta = typeof to.meta?.platformDomain === 'string' ? to.meta.platformDomain : ''

  let domain = platformDomainMeta

  if (!requiresPlatformAdmin || !domain) {
    const fallbackMatch = to.path.match(/^\/platform\/([^/]+)\/([^/]+)\/admin(?:\/.*)?$/)

    if (!fallbackMatch) {
      return
    }

    domain = fallbackMatch[2] ?? ''
  }

  if (!slug || !domain) {
    return
  }

  const platformPermissions = usePlatformPermissions(slug)

  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    return navigateTo(platformPermissions.getDeniedRedirectPath(domain))
  }
})
