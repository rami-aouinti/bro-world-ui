import { isKnownPermission } from '~/constants/permissions'

// Source de vérité des accès : les permissions valides sont définies dans
// `~/constants/permissions` et chaque page protégée déclare
// `meta.requiredPermissions` via `definePageMeta`.
const normalizeRequiredPermissions = (permissions: unknown): string[] => {
  if (permissions == null) {
    return []
  }

  const queue = Array.isArray(permissions) ? [...permissions] : [permissions]
  const normalized: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()

    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }

    if (typeof current !== 'string') {
      continue
    }

    const permission = current.trim()

    if (!isKnownPermission(permission) || normalized.includes(permission)) {
      continue
    }

    normalized.push(permission)
  }

  return normalized
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useAuth()
  const authSession = useAuthSessionStore()
  const { canPermission } = useAccessControl()

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
    return navigateTo({
      path: '/profile',
      query: {
        message: 'accessDenied',
      },
    })
  }
})
