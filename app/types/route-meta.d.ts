import 'vue-router'

import type { BusinessPermission } from '~/constants/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    gamingTheme?: boolean
    requiredRoles?: string | string[]
    requiredPermissions?: BusinessPermission | BusinessPermission[]
    skeleton?: string
  }
}

export {}
