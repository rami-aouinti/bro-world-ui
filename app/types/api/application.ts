import type { UUID } from './common'

export interface ApplicationRead {
  id: UUID
  slug?: string
  title: string
  description?: string
  photo?: string
  status: 'active' | 'inactive' | string
  private: boolean
  platformId: UUID
  platformName: string
  platformKey?: string
  ownerId?: UUID
  author?: {
    id: UUID
    firstName: string
    lastName: string
    photo?: string
    username?: string
  }
  createdAt?: string
  isOwner?: boolean
}

export interface ApplicationListFilters {
  search?: string
  platformKey?: string
}

export interface ApplicationListPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface ApplicationListResponse {
  items: ApplicationRead[]
  pagination: ApplicationListPagination
  filters?: {
    platformKey?: string
  }
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
  description?: string
  photo?: string
  status: 'active' | 'inactive' | string
  private: boolean
  configurations: ApplicationConfiguration[]
  plugins: ApplicationPluginPayload[]
}
