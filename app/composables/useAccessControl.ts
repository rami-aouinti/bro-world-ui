import { computed } from 'vue'
import { BUSINESS_PERMISSIONS, isKnownPermission } from '~/constants/permissions'

import type { BusinessPermission, PermissionContext } from '~/constants/permissions'
import type { UUID } from '~/types/api/common'

const normalizeToArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

const normalizeRoles = (roles: string | string[] | undefined | null): string[] => {
  return normalizeToArray(roles)
}

const normalizePermissions = (
  permissions: BusinessPermission | BusinessPermission[] | undefined | null,
): BusinessPermission[] => {
  return normalizeToArray(permissions)
}

export const useAccessControl = () => {
  const authSession = useAuthSessionStore()
  const { isAuthenticated } = useAuth()

  const userRoles = computed(() => authSession.roles ?? [])
  const userRoleSet = computed(() => new Set(userRoles.value))

  const hasRole = (roles: string | string[]) => {
    const requiredRoles = normalizeRoles(roles)

    if (requiredRoles.length === 0) {
      return true
    }

    return requiredRoles.some(role => userRoleSet.value.has(role))
  }

  const isSelf = (userId?: UUID | null) => {
    if (!userId || !authSession.profile) {
      return false
    }

    return authSession.profile.id === userId
  }

  const canPermission = (permission: string, context?: PermissionContext) => {
    if (!isAuthenticated.value) {
      return false
    }

    if (!isKnownPermission(permission)) {
      return false
    }

    const rule = BUSINESS_PERMISSIONS[permission]
    const roleCheck = rule.rolesAny ? hasRole(rule.rolesAny) : false
    const conditionCheck = rule.condition
      ? rule.condition({
          context,
          isSelf,
          isAuthenticated: isAuthenticated.value,
        })
      : false

    if (!rule.rolesAny && !rule.condition) {
      return true
    }

    return roleCheck || conditionCheck
  }

  const can = (permissions?: BusinessPermission | BusinessPermission[], context?: PermissionContext) => {
    if (!isAuthenticated.value) {
      return false
    }

    const requiredPermissions = normalizePermissions(permissions)

    if (requiredPermissions.length === 0) {
      return true
    }

    return requiredPermissions.some(permission => canPermission(permission, context))
  }

  return {
    userRoles,
    hasRole,
    isSelf,
    canPermission,
    can,
  }
}
