import { isKnownPermission } from '~/constants/permissions'

const normalizeRequiredPermissions = (permissions: unknown) => {
  if (!permissions) {
    return []
  }

  const rawPermissions = Array.isArray(permissions) ? permissions : [permissions]

  return rawPermissions
    .filter((permission): permission is string => typeof permission === 'string')
    .filter(isKnownPermission)
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { initSession, isAuthenticated } = useAuth()
  const authSession = useAuthSessionStore()
  const { canPermission } = useAccessControl()

  await initSession()

  const requiredPermissions = normalizeRequiredPermissions(to.meta.requiredPermissions)

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (requiredPermissions.length === 0) {
    return
  }

  const hasAccess = requiredPermissions.some(permission => canPermission(permission, { userId: authSession.profile?.id }))

  if (!hasAccess) {
    return navigateTo('/profile')
  }
})
