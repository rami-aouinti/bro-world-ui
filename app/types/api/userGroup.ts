import type { UUID } from './common'
import type { Role } from './role'
import type { UserRead } from './user'

export interface UserGroup {
  id: UUID
  name: string
  role: Role
}

export interface CreateUserGroupPayload {
  name: string
  role: UUID
}

export type UpdateUserGroupPayload = CreateUserGroupPayload

export type PatchUserGroupPayload = Partial<UpdateUserGroupPayload>

export type UserGroupUsersResponse = UserRead[]
