import type { UUID } from '~/types/api/common'

export type PermissionContext = {
  userId?: UUID | null
}

type PermissionConditionArgs = {
  context?: PermissionContext
  isSelf: (userId?: UUID | null) => boolean
  isAuthenticated: boolean
}

type PermissionRule = {
  rolesAny?: string[]
  condition?: (args: PermissionConditionArgs) => boolean
}

export const BUSINESS_PERMISSIONS = {
  'apiKey.readAll': {
    rolesAny: ['ROLE_ROOT'],
  },
  'user.readById': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'user.readOwnGroups': {
    rolesAny: ['ROLE_ROOT'],
    condition: ({ context, isSelf }) => isSelf(context?.userId),
  },
  'admin.access': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'profile.readOwn': {
    condition: ({ context, isSelf, isAuthenticated }) => isAuthenticated && isSelf(context?.userId),
  },
  'profile.logout': {
    condition: ({ isAuthenticated }) => isAuthenticated,
  },
} satisfies Record<string, PermissionRule>

export type BusinessPermission = keyof typeof BUSINESS_PERMISSIONS

export const isKnownPermission = (permission: string): permission is BusinessPermission => {
  return permission in BUSINESS_PERMISSIONS
}
