import { useApiClient } from '../useApiClient'
import type { UUID } from '~/types/api/common'
import type {
  CreateCrmProjectGithubRepositoryPayload,
  CreateCrmBillingPayload,
  CreateCrmCompanyPayload,
  CreateCrmContactPayload,
  CreateCrmProjectPayload,
  CreateCrmSprintPayload,
  CreateCrmTaskPayload,
  CreateCrmTaskRequestPayload,
  CrmAttachment,
  CrmBilling,
  CrmCollectionResponse,
  CrmCompany,
  CrmContact,
  CrmDashboardResponse,
  CrmEmployee,
  CrmGithubAccountRepository,
  CrmGithubBranch,
  CrmGithubDashboardResponse,
  CrmGithubPullRequestDetails,
  CrmGithubPullRequestListItem,
  CrmGithubPullRequestState,
  CrmGithubRepository,
  CrmProjectGithubRepositoryMutationResponse,
  CrmProject,
  CrmPublicUsersResponse,
  CrmReportsResponse,
  CrmSprint,
  CrmTask,
  CrmTaskListResponse,
  CrmTaskRequest,
  CrmTasksBySprintResponse,
  UpdateCrmBillingPayload,
  UpdateCrmContactPayload,
  UpdateCrmProjectPayload,
  UpdateCrmSprintPayload,
  UpdateCrmTaskPayload,
  UpdateCrmTaskRequestPayload,
  UpdateCrmTaskRequestStatusPayload,
} from '~/types/api/crm'

export const useCrmApi = () => {
  const { apiFetch } = useApiClient()

  const basePath = (applicationSlug: string) => `/api/v1/crm/applications/${applicationSlug}`

  return {
    getPublicUsers() {
      return apiFetch<CrmPublicUsersResponse>('/api/v1/public/users', { method: 'GET' })
    },

    getCompanies(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmCompany>>(`${basePath(applicationSlug)}/companies`, { method: 'GET' })
    },
    getCompanyById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmCompany>(`${basePath(applicationSlug)}/companies/${id}`, { method: 'GET' })
    },
    createCompany(applicationSlug: string, payload: CreateCrmCompanyPayload) {
      return apiFetch<CrmCompany>(`${basePath(applicationSlug)}/companies`, { method: 'POST', body: payload })
    },
    deleteCompany(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/companies/${id}`, { method: 'DELETE' })
    },


    getContacts(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmContact>>(`${basePath(applicationSlug)}/contacts`, { method: 'GET' })
    },

    getEmployees(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmEmployee>>(`${basePath(applicationSlug)}/employees`, { method: 'GET' })
    },
    getContactById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmContact>(`${basePath(applicationSlug)}/contacts/${id}`, { method: 'GET' })
    },
    createContact(applicationSlug: string, payload: CreateCrmContactPayload) {
      return apiFetch<CrmContact>(`${basePath(applicationSlug)}/contacts`, { method: 'POST', body: payload })
    },
    updateContact(applicationSlug: string, id: UUID, payload: UpdateCrmContactPayload) {
      return apiFetch<CrmContact>(`${basePath(applicationSlug)}/contacts/${id}`, { method: 'PATCH', body: payload })
    },
    deleteContact(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/contacts/${id}`, { method: 'DELETE' })
    },

    getDashboard(applicationSlug: string) {
      return apiFetch<CrmDashboardResponse>(`${basePath(applicationSlug)}/dashboard`, { method: 'GET' })
    },

    getBillings(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmBilling>>(`${basePath(applicationSlug)}/billings`, { method: 'GET' })
    },
    getBillingById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmBilling>(`${basePath(applicationSlug)}/billings/${id}`, { method: 'GET' })
    },
    createBilling(applicationSlug: string, payload: CreateCrmBillingPayload) {
      return apiFetch<CrmBilling>(`${basePath(applicationSlug)}/billings`, { method: 'POST', body: payload })
    },
    updateBilling(applicationSlug: string, id: UUID, payload: UpdateCrmBillingPayload) {
      return apiFetch<CrmBilling>(`${basePath(applicationSlug)}/billings/${id}`, { method: 'PATCH', body: payload })
    },
    deleteBilling(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/billings/${id}`, { method: 'DELETE' })
    },
    getReports(applicationSlug: string) {
      return apiFetch<CrmReportsResponse>(`${basePath(applicationSlug)}/reports`, { method: 'GET' })
    },

    getProjects(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmProject>>(`${basePath(applicationSlug)}/projects`, { method: 'GET' })
    },
    getProjectById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects/${id}`, { method: 'GET' })
    },
    getProjectGithubRepositories(applicationSlug: string, projectId: UUID) {
      return apiFetch<CrmCollectionResponse<CrmGithubRepository>>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories`, { method: 'GET' })
    },
    getProjectGithubAccountRepositories(applicationSlug: string, projectId: UUID) {
      return apiFetch<CrmCollectionResponse<CrmGithubAccountRepository>>(`${basePath(applicationSlug)}/projects/${projectId}/github/account/repositories`, { method: 'GET' })
    },
    addProjectGithubRepository(applicationSlug: string, projectId: UUID, payload: CreateCrmProjectGithubRepositoryPayload) {
      return apiFetch<CrmProjectGithubRepositoryMutationResponse>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories`, { method: 'POST', body: payload })
    },
    getProjectGithubDashboard(applicationSlug: string, projectId: UUID) {
      return apiFetch<CrmGithubDashboardResponse>(`${basePath(applicationSlug)}/projects/${projectId}/github/dashboard`, { method: 'GET' })
    },
    getProjectGithubPullRequests(
      applicationSlug: string,
      projectId: UUID,
      filters: { repo: string; state?: CrmGithubPullRequestState; page?: number; limit?: number },
    ) {
      const query = new URLSearchParams({ repo: filters.repo, state: filters.state ?? 'open' })
      if (filters.page) query.set('page', String(filters.page))
      if (filters.limit) query.set('limit', String(filters.limit))
      return apiFetch<CrmCollectionResponse<CrmGithubPullRequestListItem>>(`${basePath(applicationSlug)}/projects/${projectId}/github/pull-requests?${query.toString()}`, { method: 'GET' })
    },
    getProjectGithubPullRequestByNumber(applicationSlug: string, projectId: UUID, number: number, repo: string) {
      const query = new URLSearchParams({ repo })
      return apiFetch<CrmGithubPullRequestDetails>(`${basePath(applicationSlug)}/projects/${projectId}/github/pull-requests/${number}?${query.toString()}`, { method: 'GET' })
    },
    getProjectGithubBranches(
      applicationSlug: string,
      projectId: UUID,
      filters: { repo: string; page?: number; limit?: number },
    ) {
      const query = new URLSearchParams({ repo: filters.repo })
      if (filters.page) query.set('page', String(filters.page))
      if (filters.limit) query.set('limit', String(filters.limit))
      return apiFetch<CrmCollectionResponse<CrmGithubBranch>>(`${basePath(applicationSlug)}/projects/${projectId}/github/branches?${query.toString()}`, { method: 'GET' })
    },
    createProject(applicationSlug: string, payload: CreateCrmProjectPayload) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects`, { method: 'POST', body: payload })
    },
    updateProject(applicationSlug: string, id: UUID, payload: UpdateCrmProjectPayload) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects/${id}`, { method: 'PATCH', body: payload })
    },
    deleteProject(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${id}`, { method: 'DELETE' })
    },
    assignProjectAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${id}/assignees/${userId}`, { method: 'PUT' })
    },
    removeProjectAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${id}/assignees/${userId}`, { method: 'DELETE' })
    },


    uploadProjectFiles(applicationSlug: string, id: UUID, files: File[]) {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files[]', file)
      })

      return apiFetch<{ files: CrmAttachment[] }>(`${basePath(applicationSlug)}/projects/${id}/files`, { method: 'POST', body: formData })
    },

    getSprints(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmSprint>>(`${basePath(applicationSlug)}/sprints`, { method: 'GET' })
    },
    getSprintById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmSprint>(`${basePath(applicationSlug)}/sprints/${id}`, { method: 'GET' })
    },
    createSprint(applicationSlug: string, payload: CreateCrmSprintPayload) {
      return apiFetch<CrmSprint>(`${basePath(applicationSlug)}/sprints`, { method: 'POST', body: payload })
    },
    updateSprint(applicationSlug: string, id: UUID, payload: UpdateCrmSprintPayload) {
      return apiFetch<CrmSprint>(`${basePath(applicationSlug)}/sprints/${id}`, { method: 'PATCH', body: payload })
    },
    deleteSprint(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${id}`, { method: 'DELETE' })
    },
    assignSprintAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${id}/assignees/${userId}`, { method: 'PUT' })
    },
    removeSprintAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${id}/assignees/${userId}`, { method: 'DELETE' })
    },

    getTasks(applicationSlug: string) {
      return apiFetch<CrmTaskListResponse>(`${basePath(applicationSlug)}/tasks`, { method: 'GET' })
    },
    getTaskById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks/${id}`, { method: 'GET' })
    },
    createTask(applicationSlug: string, payload: CreateCrmTaskPayload) {
      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks`, { method: 'POST', body: payload })
    },
    updateTask(applicationSlug: string, id: UUID, payload: UpdateCrmTaskPayload) {
      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks/${id}`, { method: 'PATCH', body: payload })
    },
    deleteTask(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/tasks/${id}`, { method: 'DELETE' })
    },
    getMyTasks(applicationSlug: string) {
      return apiFetch<CrmTaskListResponse>(`${basePath(applicationSlug)}/me/tasks`, { method: 'GET' })
    },
    getSprintTasks(applicationSlug: string, sprintId: UUID) {
      return apiFetch<CrmTaskListResponse>(`${basePath(applicationSlug)}/sprints/${sprintId}/tasks`, { method: 'GET' })
    },
    getTasksBySprint(applicationSlug: string) {
      return apiFetch<CrmTasksBySprintResponse>(`${basePath(applicationSlug)}/tasks/by-sprint`, { method: 'GET' })
    },
    assignTaskAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/tasks/${id}/assignees/${userId}`, { method: 'PUT' })
    },
    removeTaskAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/tasks/${id}/assignees/${userId}`, { method: 'DELETE' })
    },


    uploadTaskFiles(applicationSlug: string, id: UUID, files: File[]) {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files[]', file)
      })

      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks/${id}/files`, { method: 'POST', body: formData })
    },

    getTaskRequests(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmTaskRequest>>(`${basePath(applicationSlug)}/task-requests`, { method: 'GET' })
    },
    getTaskRequestById(applicationSlug: string, id: UUID) {
      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests/${id}`, { method: 'GET' })
    },
    createTaskRequest(applicationSlug: string, payload: CreateCrmTaskRequestPayload) {
      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests`, { method: 'POST', body: payload })
    },
    updateTaskRequest(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestPayload) {
      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests/${id}`, { method: 'PATCH', body: payload })
    },
    deleteTaskRequest(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}`, { method: 'DELETE' })
    },
    assignTaskRequestAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/assignees/${userId}`, { method: 'PUT' })
    },
    removeTaskRequestAssignee(applicationSlug: string, id: UUID, userId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/assignees/${userId}`, { method: 'DELETE' })
    },


    uploadTaskRequestFiles(applicationSlug: string, id: UUID, files: File[]) {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files[]', file)
      })

      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests/${id}/files`, { method: 'POST', body: formData })
    },
    updateTaskRequestStatus(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/status`, { method: 'PATCH', body: payload })
    },
    updateTaskRequestStatusPut(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/status`, { method: 'PUT', body: payload })
    },
  }
}
