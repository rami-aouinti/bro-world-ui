import type { UUID } from './common'

export interface PlatformRead {
  id: UUID
  name: string
  description?: string
  private: boolean
  photo?: string
  enabled: boolean
  status?: string
  user?: UUID | null
}

export interface PlatformWrite {
  name: string
  description?: string
  private?: boolean
  photo?: string
  enabled?: boolean
  status?: string
  user?: UUID | null
}

export type CreatePlatformPayload = PlatformWrite

export type UpdatePlatformPayload = PlatformWrite

export type PatchPlatformPayload = Partial<UpdatePlatformPayload>
