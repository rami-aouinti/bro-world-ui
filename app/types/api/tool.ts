import type { UUID } from './common'

export interface Tool {
  id: UUID
  key: string
  name: string
  description?: string
  enabled?: boolean
}

export interface CreateToolPayload {
  key: string
  name: string
  description?: string
  enabled?: boolean
}

export type UpdateToolPayload = CreateToolPayload

export type PatchToolPayload = Partial<UpdateToolPayload>
