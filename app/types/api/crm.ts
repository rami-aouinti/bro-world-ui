import type { UUID } from './common'

export interface CrmAssignee {
  id?: UUID
  name?: string
  email?: string
  firstName?: string
  lastName?: string
  photo?: string
}

export interface CrmPublicUser {
  id: UUID
  email: string
  firstName: string
  lastName: string
  photo: string | null
}

export interface CrmPublicUsersResponse {
  users: CrmPublicUser[]
  filters: unknown[]
}

export interface CrmCompany {
  id: UUID
  name: string
  industry: string | null
  website: string | null
  contactEmail: string | null
  phone: string | null
}

export interface CrmContact {
  id: UUID
  companyId?: UUID
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  city: string | null
  score: number | null
}

export interface CrmProject {
  id: UUID
  code?: string | null
  description?: string | null
  name: string
  companyId: UUID
  status: string | boolean
  startedAt?: string | null
  dueAt?: string | null
  assignees?: CrmAssignee[]
}

export interface CrmSprint {
  id: UUID
  project?: Pick<CrmProject, 'id' | 'name' | 'code' | 'description' | 'status'>
  goal?: string | null
  name: string
  projectId: UUID
  status: string | boolean
  startDate: string | null
  endDate: string | null
  assignees?: CrmAssignee[]
}

export interface CrmTaskChild {
  id: UUID
  taskId: UUID
  title: string
  status: string
  requestedAt: string | null
  resolvedAt: string | null
  assignees: CrmAssignee[]
}

export interface CrmTask {
  id: UUID
  title: string
  description?: string | null
  projectId: UUID
  projectName: string
  sprintId: UUID
  sprintName: string
  status: string
  priority: string
  dueAt: string | null
  estimatedHours: number | null
  updatedAt: string | null
  assignees: CrmAssignee[]
  children: CrmTaskChild[]
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
  code?: string
  description?: string
  companyId: UUID
  status?: string
  startedAt?: string
  dueAt?: string
}

export interface CreateCrmContactPayload {
  companyId?: UUID
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
  city?: string
  score?: number
}

export interface CreateCrmSprintPayload {
  name: string
  goal?: string
  projectId: UUID
  status?: string
  startDate?: string
  endDate?: string
}

export interface CreateCrmTaskPayload {
  title: string
  description?: string
  projectId: UUID
  sprintId: UUID
  status?: string
  priority?: string
  dueAt?: string
  estimatedHours?: number
  assigneeIds?: UUID[]
}



export interface CrmTasksBySprintResponse {
  items: Array<{
    sprintId: UUID
    sprintName: string
    tasks: CrmTask[]
  }>
}

export interface UpdateCrmProjectPayload {
  name?: string
  code?: string
  description?: string
  companyId?: UUID
  status?: string
  startedAt?: string
  dueAt?: string
}

export interface UpdateCrmContactPayload {
  companyId?: UUID
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  city?: string
  score?: number
}

export interface UpdateCrmSprintPayload {
  name?: string
  goal?: string
  projectId?: UUID
  status?: string
  startDate?: string
  endDate?: string
}

export interface UpdateCrmTaskPayload {
  title?: string
  description?: string
  projectId?: UUID
  sprintId?: UUID
  status?: string
  priority?: string
  dueAt?: string
  estimatedHours?: number
}

export interface UpdateCrmTaskRequestPayload {
  title?: string
  taskId?: UUID
  status?: string
}

export interface CreateCrmTaskRequestPayload {
  title: string
  taskId: UUID
  status?: string
}

export interface UpdateCrmTaskRequestStatusPayload {
  status: string
}
