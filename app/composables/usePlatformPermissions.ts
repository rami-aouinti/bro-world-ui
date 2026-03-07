import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

const PLATFORM_ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_ROOT']

export const usePlatformPermissions = (slugInput: MaybeRefOrGetter<string>) => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()
  const { slug, application, isOwner: isApplicationOwner, resolveApplication } = usePlatformApplication(slugInput)

  const userRoles = computed(() => authSession.roles ?? [])
  const hasAdminRole = computed(() => userRoles.value.some(role => PLATFORM_ADMIN_ROLES.includes(role)))
  const isOwner = computed(() => isApplicationOwner.value || hasAdminRole.value)
  const canAccessAdmin = computed(() => isAuthenticated.value && isOwner.value)

  const getHomePath = (domainInput: MaybeRefOrGetter<string>) => {
    const domain = String(toValue(domainInput) ?? '').trim()
    return `/platform/${slug.value}/${domain}/home`
  }

  const getDeniedRedirectPath = (domainInput: MaybeRefOrGetter<string>) => {
    return `${getHomePath(domainInput)}?accessDenied=admin`
  }

  return {
    slug,
    application,
    userRoles,
    hasAdminRole,
    isOwner,
    canAccessAdmin,
    resolveApplication,
    getHomePath,
    getDeniedRedirectPath,
  }
}
