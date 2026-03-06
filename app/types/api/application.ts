import type { UUID } from './common'

export interface ApplicationRead {
  id: UUID
  title: string
  status: 'active' | 'inactive' | string
  private: boolean
  platformId: UUID
  platformName: string
  ownerId: UUID
  isOwner?: boolean
}

export interface UpdateApplicationPayload {
  title?: string
  status?: 'active' | 'inactive' | string
  private?: boolean
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
