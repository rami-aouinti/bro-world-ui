import type { UUID } from './common'
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
  photo?: string
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
  photo?: string
}

export interface AttachUserGroupPayload {
  user: UUID
  userGroup: UUID
}

export type UserRolesResponse = string[]

export type UserGroupsResponse = UserGroup[]

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
