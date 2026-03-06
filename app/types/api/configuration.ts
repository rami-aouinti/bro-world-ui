import type { UUID } from './common'

export type ConfigurationScope = 'system' | 'user' | 'platform' | 'plugin' | 'public'

export interface ConfigurationRead {
  id: UUID
  name: string
  description?: string
  value?: string | number | boolean | null
  scope: ConfigurationScope
  private?: boolean
  enabled?: boolean
  user?: UUID | null
  platform?: UUID | null
  plugin?: UUID | null
}

export interface ConfigurationWrite {
  name: string
  description?: string
  value?: string | number | boolean | null
  scope: ConfigurationScope
  private?: boolean
  enabled?: boolean
  user?: UUID | null
  platform?: UUID | null
  plugin?: UUID | null
}

export type CreateConfigurationPayload = ConfigurationWrite

export type UpdateConfigurationPayload = ConfigurationWrite

export type PatchConfigurationPayload = Partial<UpdateConfigurationPayload>
