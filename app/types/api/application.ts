import type { UUID } from './common'

export interface ApplicationRead {
  id: UUID
  title: string
  status: 'active' | 'inactive' | string
  private: boolean
  platformId: UUID
  platformName: string
  ownerId: UUID
}

export interface ApplicationConfiguration {
  configurationKey: string
  configurationValue: Record<string, unknown>
}

export interface ApplicationPluginPayload {
  pluginId: UUID
  configurations: ApplicationConfiguration[]
}

export interface CreateApplicationPayload {
  platformId: UUID
  title: string
  status: 'active' | 'inactive' | string
  private: boolean
  configurations: ApplicationConfiguration[]
  plugins: ApplicationPluginPayload[]
}
