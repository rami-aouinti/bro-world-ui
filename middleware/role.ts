import { isKnownPermission } from '~/constants/permissions'

const normalizePermissions = (permissions: unknown) => {
  if (!permissions) {
    return []
  }

  const rawPermissions = Array.isArray(permissions) ? permissions : [permissions]

  return rawPermissions
    .filter((permission): permission is string => typeof permission === 'string')
    .filter(isKnownPermission)
}

export default defineNuxtRouteMiddleware(async (to) => {
  const requiredPermissions = normalizePermissions(to.meta.requiredPermissions)

  if (requiredPermissions.length === 0) {
    return
  }

  const { initSession } = useAuth()
  const authSession = useAuthSessionStore()
  const { canPermission } = useAccessControl()

  await initSession()

  const hasAccess = requiredPermissions.some(permission => canPermission(permission, { userId: authSession.profile?.id }))

  if (!hasAccess) {
    return navigateTo({
      path: '/',
      query: {
        message: 'accessDenied',
      },
    })
  }
})
