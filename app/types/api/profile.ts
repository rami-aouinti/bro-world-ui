import type { UUID } from './common'

export interface Profile {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
}

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
}

export type PatchProfilePayload = Partial<UpdateProfilePayload>


export interface ApplicationConfigurationPayload {
  configurationKey: string
  configurationValue: Record<string, unknown>
}

export interface ApplicationPluginPayload {
  pluginId: UUID
  configurations: ApplicationConfigurationPayload[]
}

export interface CreateApplicationPayload {
  platformId: UUID
  title: string
  description?: string
  photo?: string
  status: 'active' | 'inactive' | string
  private: boolean
  configurations: ApplicationConfigurationPayload[]
  plugins: ApplicationPluginPayload[]
}
