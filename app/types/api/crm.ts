import type { BlogRead } from './blog'
import type { UUID } from './common'

export interface CrmAssignee {
  id?: UUID
  userId?: UUID
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
  projects?: Array<{
    id: UUID
    name: string
  }>
}

export interface CrmTaskListItem {
  id: UUID
  title?: string
  TITLE?: string
  description?: string | null
  status: string
  dueAt?: string | null
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

export interface CrmEmployee {
  id: UUID
  userId: UUID
  firstName: string
  lastName: string
  email: string | null
  photo?: string | null
  positionName: string | null
  roleName: string | null
  createdAt: string | null
  updatedAt: string | null
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
  attachments?: CrmAttachment[]
  wikiPages?: Array<{
    id: string
    title: string
    content: string
    createdAt: string
  }>
  assignees?: CrmAssignee[]
  tasks?: CrmTaskListItem[]
  githubRepositories?: CrmGithubRepository[]
  githubConfigured?: boolean
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
  tasks?: CrmTaskListItem[]
}

export interface CrmTaskChild {
  id: UUID
  taskId?: UUID
  title: string
  description?: string | null
  status: string
  requestedAt?: string | null
  resolvedAt?: string | null
  assignees?: CrmAssignee[]
  attachments?: CrmAttachment[]
  blog?: BlogRead | null
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
  attachments?: CrmAttachment[]
}

export interface CrmTaskRequest {
  id: UUID
  title: string
  description?: string | null
  status: string
  requestedAt: string
  resolvedAt: string | null
  taskId: UUID
  assignees?: CrmAssignee[]
  attachments?: CrmAttachment[]
  blog?: BlogRead | null
}

export interface CrmAttachment {
  url: string
  size: number
  mimeType: string
  extension: string
  uploadedAt: string
  originalName: string
}

export type CrmBillingStatus = 'pending' | 'paid' | 'overdue'

export interface CrmBilling {
  id: UUID
  companyId: UUID
  label: string
  amount: number
  currency: string
  status: CrmBillingStatus
  dueAt: string | null
  paidAt: string | null
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

export interface CrmGithubRepository {
  fullName: string
  defaultBranch: string
}

export interface CrmGithubProject {
  id: string
  title: string
  number: number
  url: string
  closed: boolean
  updatedAt: string
}

export interface CrmGithubProjectItem {
  id: string
  issue: {
    id: string
    number: number
    title: string
    url: string
    state: 'OPEN' | 'CLOSED'
  } | null
}

export interface CrmGithubAccountRepository extends CrmGithubRepository {
  name: string
  private: boolean
  htmlUrl: string
  owner: string
}

export interface CreateCrmProjectGithubRepositoryPayload {
  fullName: string
}

export interface CreateCrmGithubProjectPayload {
  owner: string
  title: string
}

export interface CreateCrmGithubRepositoryPayload {
  name: string
  description?: string
  private: boolean
}

export interface CrmProjectGithubRepositoryMutationResponse {
  id: UUID
  repository: CrmGithubRepository
  repositories: CrmGithubRepository[]
}

export interface CrmGithubDashboardResponse {
  repositories: CrmGithubRepository[]
  pullRequests: {
    open: number
    closed: number
    merged: number
  }
}

export type CrmGithubPullRequestState = 'open' | 'closed' | 'close'

export interface CrmGithubPullRequestListItem {
  number: number
  title: string
  state: CrmGithubPullRequestState
  mergedAt: string | null
  author: string
  head: string
  base: string
  draft: boolean
  htmlUrl: string
}

export interface CrmGithubPullRequestDetails {
  number: number
  title: string
  state: CrmGithubPullRequestState
  author: string
  commits: number
  changedFiles: number
  additions: number
  deletions: number
  mergedAt: string | null
  mergeable: boolean | null
  statusesUrl: string | null
  head: string
  base: string
  htmlUrl: string
}

export interface CrmGithubBranch {
  name: string
  protected: boolean
  sha: string
}

export type CrmGithubIssueState = 'open' | 'closed' | 'all'

export interface CrmGithubIssueListItem {
  number: number
  title: string
  state: Exclude<CrmGithubIssueState, 'all'>
  author: string
  comments: number
  htmlUrl: string
  createdAt: string
  updatedAt: string
}

export interface CrmGithubIssueDetails extends CrmGithubIssueListItem {
  body: string | null
}

export interface CreateCrmGithubIssuePayload {
  repository: string
  title: string
  body?: string
}

export interface UpdateCrmGithubIssuePayload {
  repository: string
  state: 'open' | 'closed'
}

export interface CrmReportsResponse {
  kpis: {
    pipeline: number
    dealsWon: number
    cycleDays: number
    npsClients: number
  }
  counts: {
    companies: number
    contacts: number
    employees: number
    billings: number
    tasks: number
  }
  contacts: Array<{
    id: UUID
    name: string
    email: string
    jobTitle: string
    city: string
    score: number
  }>
  recommendedActions: Array<{
    priority: string
    title: string
    owner: string
    etaDays: number
  }>
}

export interface CrmCollectionResponse<T> {
  items: T[]
  pagination?: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage?: boolean
  }
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

export interface CreateCrmBillingPayload {
  companyId: UUID
  label: string
  amount: number
  currency: string
  status: CrmBillingStatus
  dueAt?: string | null
  paidAt?: string | null
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

export interface UpdateCrmBillingPayload {
  companyId?: UUID
  label?: string
  amount?: number
  currency?: string
  status?: CrmBillingStatus
  dueAt?: string | null
  paidAt?: string | null
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
