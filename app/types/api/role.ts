import type { UUID } from './common'

export interface Role {
  id: UUID
  description?: string
}

export interface CreateRolePayload {
  id: UUID
  description?: string
}

export type UpdateRolePayload = CreateRolePayload

export type PatchRolePayload = Partial<UpdateRolePayload>
