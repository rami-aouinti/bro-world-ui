import type { UUID } from './common'

export type ConfigurationScope = 'system' | 'user' | 'platform' | 'plugin' | 'public'

export interface ConfigurationRead {
  id: UUID
  configurationKey: string
  configurationValue?: string | number | boolean | null
  scope: ConfigurationScope
  private?: boolean
  enabled?: boolean
  user?: UUID | null
  platform?: UUID | null
  plugin?: UUID | null
  description?: string
}

export interface ConfigurationWrite {
  configurationKey: string
  configurationValue?: string | number | boolean | null
  scope: ConfigurationScope
  private?: boolean
  enabled?: boolean
  user?: UUID | null
  platform?: UUID | null
  plugin?: UUID | null
  description?: string
}

export type CreateConfigurationPayload = Pick<ConfigurationWrite, 'configurationKey' | 'configurationValue' | 'scope'>

export type UpdateConfigurationPayload = ConfigurationWrite

export type PatchConfigurationPayload = Partial<UpdateConfigurationPayload>
