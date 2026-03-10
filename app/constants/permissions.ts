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
  'configuration.readList': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'configuration.readById': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'configuration.create': {
    rolesAny: ['ROLE_ROOT'],
  },
  'configuration.update': {
    rolesAny: ['ROLE_ROOT'],
  },
  'configuration.patch': {
    rolesAny: ['ROLE_ROOT'],
  },
  'configuration.delete': {
    rolesAny: ['ROLE_ROOT'],
  },
  'platform.readList': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'platform.readById': {
    rolesAny: ['ROLE_ADMIN', 'ROLE_ROOT'],
  },
  'platform.create': {
    rolesAny: ['ROLE_ROOT'],
  },
  'platform.update': {
    rolesAny: ['ROLE_ROOT'],
  },
  'platform.patch': {
    rolesAny: ['ROLE_ROOT'],
  },
  'platform.delete': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.readList': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.readById': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.create': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.update': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.patch': {
    rolesAny: ['ROLE_ROOT'],
  },
  'plugin.delete': {
    rolesAny: ['ROLE_ROOT'],
  },
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
  'page.home.readList': {
    rolesAny: ['ROLE_ROOT'],
  },
  'page.about.readList': {
    rolesAny: ['ROLE_ROOT'],
  },
  'page.contact.readList': {
    rolesAny: ['ROLE_ROOT'],
  },
  'page.faq.readList': {
    rolesAny: ['ROLE_ROOT'],
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
