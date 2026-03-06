import type { UUID } from './common'

export interface PluginRead {
  id: UUID
  name: string
  description?: string
  private: boolean
  photo?: string
  enabled: boolean
  platform?: UUID | null
}

export interface PluginWrite {
  name: string
  description?: string
  private?: boolean
  photo?: string
  enabled?: boolean
  platform?: UUID | null
}

export type CreatePluginPayload = PluginWrite

export type UpdatePluginPayload = PluginWrite

export type PatchPluginPayload = Partial<UpdatePluginPayload>
