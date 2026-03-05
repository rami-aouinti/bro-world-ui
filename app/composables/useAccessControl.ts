import { computed } from 'vue'

const normalizeRoles = (roles: string | string[] | undefined | null): string[] => {
  if (!roles) {
    return []
  }

  return Array.isArray(roles) ? roles : [roles]
}

export const useAccessControl = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()

  const userRoles = computed(() => authSession.roles ?? [])

  const hasRole = (roles: string | string[]) => {
    const requiredRoles = normalizeRoles(roles)

    if (requiredRoles.length === 0) {
      return true
    }

    return requiredRoles.some(role => userRoles.value.includes(role))
  }

  const can = (roles?: string | string[]) => {
    if (!isAuthenticated.value) {
      return false
    }

    const requiredRoles = normalizeRoles(roles)

    if (requiredRoles.length === 0) {
      return true
    }

    return hasRole(requiredRoles)
  }

  return {
    userRoles,
    hasRole,
    can,
  }
}
