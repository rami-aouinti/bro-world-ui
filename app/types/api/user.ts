import type { UUID } from './common'
import type { Role } from './role'
import type { UserGroup } from './userGroup'

export interface UserRead {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
  roles: Role[]
  userGroups: UserGroup[]
}

export interface UserWrite {
  username: string
  firstName: string
  lastName: string
  email: string
  password?: string
  language?: string
  locale?: string
  timezone: string
  roles: UUID[]
  userGroups: UUID[]
}

export interface UserProfile {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
  photo?: string
  roles: string[]
  userGroups?: string[]
}

export interface SessionResponse {
  authenticated: boolean
  profile: UserProfile | null
  roles: string[]
  locale: string | null
  expiresAt?: string
}

export type CreateUserPayload = UserWrite

export type UpdateUserPayload = UserWrite

export type PatchUserPayload = Partial<UpdateUserPayload>
