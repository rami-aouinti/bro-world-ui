import type { UUID } from './common'

export interface CrmCompany {
  id: UUID
  name: string
  industry: string | null
  website: string | null
  contactEmail: string | null
  phone: string | null
}

export interface CrmProject {
  id: UUID
  name: string
  companyId: UUID
  status: string
}

export interface CrmSprint {
  id: UUID
  name: string
  projectId: UUID
  status: string
  startDate: string | null
  endDate: string | null
}

export interface CrmTask {
  id: UUID
  title: string
  projectId: UUID
  projectName: string
  sprintId: UUID
  sprintName: string
  status: string
  priority: string
  dueAt: string | null
  estimatedHours: number | null
  updatedAt: string | null
}

export interface CrmTaskRequest {
  id: UUID
  title: string
  status: string
  requestedAt: string
  resolvedAt: string | null
  taskId: UUID
}

export interface CrmDashboardResponse {
  companies: number
  projects: number
  tasks: number
  taskRequests: {
    pending: number
    approved: number
    rejected: number
  }
}

export interface CrmCollectionResponse<T> {
  items: T[]
}

export interface CrmTaskListResponse extends CrmCollectionResponse<CrmTask> {
  pagination?: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  meta?: Record<string, unknown>
}

export interface CreateCrmCompanyPayload {
  name: string
  industry?: string
  website?: string
  contactEmail?: string
  phone?: string
}

export interface CreateCrmProjectPayload {
  name: string
  companyId: UUID
  status?: string
}

export interface CreateCrmSprintPayload {
  name: string
  projectId: UUID
  status?: string
  startDate?: string
  endDate?: string
}

export interface CreateCrmTaskPayload {
  title: string
  projectId: UUID
  sprintId: UUID
  status?: string
  priority?: string
  dueAt?: string
  estimatedHours?: number
}

export interface CreateCrmTaskRequestPayload {
  title: string
  taskId: UUID
  status?: string
}
