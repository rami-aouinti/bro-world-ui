import { useApiClient } from '../useApiClient'
import type { UUID } from '~/types/api/common'
import type {
  CreateCrmEmployeePayload,
  CreateCrmGithubBranchPayload,
  CreateCrmGithubIssueCommentPayload,
  CreateCrmGithubProjectPayload,
  CreateCrmGithubRepositoryPayload,
  CreateCrmProjectGithubRepositoryPayload,
  CreateCrmProjectWikiPagePayload,
  CreateCrmGithubIssuePayload,
  CreateCrmBillingPayload,
  CreateCrmCompanyPayload,
  CreateCrmContactPayload,
  CreateCrmProjectPayload,
  CreateCrmSprintPayload,
  CreateCrmTaskPayload,
  CreateCrmTaskRequestPayload,
  CreateCrmTaskRequestGithubBranchPayload,
  CrmAttachment,
  CrmBilling,
  CrmCollectionResponse,
  CrmCompany,
  CrmContact,
  CrmDashboardResponse,
  CrmEmployee,
  CrmGithubAccountRepository,
  CrmGithubBranch,
  CrmGithubBranchMutationResponse,
  CrmGithubDashboardResponse,
  CrmGithubPullRequestDetails,
  CrmGithubPullRequestListItem,
  CrmGithubPullRequestState,
  CrmGithubIssueState,
  CrmGithubIssueListItem,
  CrmGithubSyncJob,
  CrmGithubIssueDetails,
  CrmGithubProject,
  CrmGithubProjectItem,
  CrmGithubRepository,
  CrmProjectGithubRepositoryMutationResponse,
  MoveCrmGithubIssuePayload,
  QueueCrmGithubBootstrapSyncPayload,
  ReplaceCrmBillingPayload,
  ReplaceCrmContactPayload,
  ReplaceCrmEmployeePayload,
  ReplaceCrmGithubRepositoryPayload,
  ReplaceCrmProjectPayload,
  ReplaceCrmSprintPayload,
  ReplaceCrmTaskPayload,
  ReplaceCrmTaskRequestPayload,
  RunCrmGithubPullRequestActionPayload,
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
  UpdateCrmEmployeePayload,
  UpdateCrmTaskRequestStatusPayload,
  UpdateCrmGithubIssuePayload,
  DeleteCrmGithubBranchPayload,
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
    replaceCompany(applicationSlug: string, id: UUID, payload: CreateCrmCompanyPayload) {
      return apiFetch<CrmCompany>(`${basePath(applicationSlug)}/companies/${id}`, { method: 'PUT', body: payload })
    },
    updateCompany(applicationSlug: string, id: UUID, payload: CreateCrmCompanyPayload) {
      return apiFetch<CrmCompany>(`${basePath(applicationSlug)}/companies/${id}`, { method: 'PATCH', body: payload })
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
    replaceContact(applicationSlug: string, id: UUID, payload: ReplaceCrmContactPayload) {
      return apiFetch<CrmContact>(`${basePath(applicationSlug)}/contacts/${id}`, { method: 'PUT', body: payload })
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
    replaceBilling(applicationSlug: string, id: UUID, payload: ReplaceCrmBillingPayload) {
      return apiFetch<CrmBilling>(`${basePath(applicationSlug)}/billings/${id}`, { method: 'PUT', body: payload })
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
    getProjectGithubAccountRepositories(
      applicationSlug: string,
      projectId: UUID,
      filters?: { page?: number; limit?: number },
    ) {
      const query = new URLSearchParams()
      if (filters?.page) query.set('page', String(filters.page))
      if (filters?.limit) query.set('limit', String(filters.limit))
      const queryString = query.toString()
      return apiFetch<CrmCollectionResponse<CrmGithubAccountRepository>>(`${basePath(applicationSlug)}/projects/${projectId}/github/account/repositories${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
    },
    addProjectGithubRepository(applicationSlug: string, projectId: UUID, payload: CreateCrmProjectGithubRepositoryPayload) {
      return apiFetch<CrmProjectGithubRepositoryMutationResponse>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories`, { method: 'POST', body: payload })
    },
    replaceProjectGithubRepository(applicationSlug: string, projectId: UUID, repositoryId: UUID, payload: ReplaceCrmGithubRepositoryPayload) {
      return apiFetch<CrmGithubRepository>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories/${repositoryId}`, { method: 'PUT', body: payload })
    },
    deleteProjectGithubRepository(applicationSlug: string, projectId: UUID, repositoryId: UUID, deleteRemote = false) {
      const query = new URLSearchParams({ deleteRemote: String(deleteRemote) })
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories/${repositoryId}?${query.toString()}`, { method: 'DELETE' })
    },
    getProjectGithubRepositoryById(applicationSlug: string, projectId: UUID, repository: string) {
      return apiFetch<CrmGithubRepository>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories/${repository}`, { method: 'GET' })
    },
    getProjectGithubProjects(
      applicationSlug: string,
      projectId: UUID,
      filters: { repo: string; page?: number; limit?: number },
    ) {
      const query = new URLSearchParams({ repo: filters.repo })
      if (filters.page) query.set('page', String(filters.page))
      if (filters.limit) query.set('limit', String(filters.limit))
      return apiFetch<CrmCollectionResponse<CrmGithubProject>>(`${basePath(applicationSlug)}/projects/${projectId}/github/projects?${query.toString()}`, { method: 'GET' })
    },
    getProjectGithubProjectItems(
      applicationSlug: string,
      projectId: UUID,
      githubProjectId: string,
      filters?: { page?: number; limit?: number },
    ) {
      const query = new URLSearchParams()
      if (filters?.page) query.set('page', String(filters.page))
      if (filters?.limit) query.set('limit', String(filters.limit))
      const queryString = query.toString()
      return apiFetch<CrmCollectionResponse<CrmGithubProjectItem>>(`${basePath(applicationSlug)}/projects/${projectId}/github/projects/${githubProjectId}/items${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
    },
    createProjectGithubProject(applicationSlug: string, projectId: UUID, payload: CreateCrmGithubProjectPayload) {
      return apiFetch<CrmGithubProject>(`${basePath(applicationSlug)}/projects/${projectId}/github/projects`, { method: 'POST', body: payload })
    },
    moveProjectGithubIssue(
      applicationSlug: string,
      projectId: UUID,
      githubProjectId: string,
      itemId: string,
      payload: MoveCrmGithubIssuePayload,
    ) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${projectId}/github/projects/${githubProjectId}/items/${itemId}/move`, { method: 'POST', body: payload })
    },
    createProjectGithubRepository(applicationSlug: string, projectId: UUID, payload: CreateCrmGithubRepositoryPayload) {
      return apiFetch<CrmGithubRepository>(`${basePath(applicationSlug)}/projects/${projectId}/github/repositories/create`, { method: 'POST', body: payload })
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
    getProjectGithubPullRequestByNumber(
      applicationSlug: string,
      projectId: UUID,
      number: number,
      repo: string,
      state?: CrmGithubPullRequestState,
    ) {
      const query = new URLSearchParams({ repo })
      if (state) query.set('state', state)
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
    createProjectGithubBranch(applicationSlug: string, projectId: UUID, payload: CreateCrmGithubBranchPayload) {
      return apiFetch<CrmGithubBranchMutationResponse>(`${basePath(applicationSlug)}/projects/${projectId}/github/branches/create`, { method: 'POST', body: payload })
    },
    deleteProjectGithubBranch(applicationSlug: string, projectId: UUID, payload: DeleteCrmGithubBranchPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${projectId}/github/branches/delete`, { method: 'DELETE', body: payload })
    },
    getProjectGithubIssues(
      applicationSlug: string,
      projectId: UUID,
      filters: { repo: string; state?: CrmGithubIssueState; page?: number; limit?: number },
    ) {
      const query = new URLSearchParams({ repo: filters.repo, state: filters.state ?? 'open' })
      if (filters.page) query.set('page', String(filters.page))
      if (filters.limit) query.set('limit', String(filters.limit))
      return apiFetch<CrmCollectionResponse<CrmGithubIssueListItem>>(`${basePath(applicationSlug)}/projects/${projectId}/github/issues?${query.toString()}`, { method: 'GET' })
    },
    createProjectGithubIssue(applicationSlug: string, projectId: UUID, payload: CreateCrmGithubIssuePayload) {
      return apiFetch<CrmGithubIssueDetails>(`${basePath(applicationSlug)}/projects/${projectId}/github/issues`, { method: 'POST', body: payload })
    },
    getProjectGithubIssueByNumber(applicationSlug: string, projectId: UUID, number: number, repo: string) {
      const query = new URLSearchParams({ repo })
      return apiFetch<CrmGithubIssueDetails>(`${basePath(applicationSlug)}/projects/${projectId}/github/issues/${number}?${query.toString()}`, { method: 'GET' })
    },
    updateProjectGithubIssue(
      applicationSlug: string,
      projectId: UUID,
      number: number,
      payload: UpdateCrmGithubIssuePayload,
    ) {
      return apiFetch<CrmGithubIssueDetails>(`${basePath(applicationSlug)}/projects/${projectId}/github/issues/${number}`, { method: 'PATCH', body: payload })
    },
    addProjectGithubIssueComment(applicationSlug: string, projectId: UUID, number: number, payload: CreateCrmGithubIssueCommentPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${projectId}/github/issues/${number}/comments`, { method: 'POST', body: payload })
    },
    runProjectGithubPullRequestAction(
      applicationSlug: string,
      projectId: UUID,
      number: number,
      payload: RunCrmGithubPullRequestActionPayload,
    ) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${projectId}/github/pull-requests/${number}/action`, { method: 'POST', body: payload })
    },
    queueGithubBootstrapSync(applicationSlug: string, payload: QueueCrmGithubBootstrapSyncPayload) {
      return apiFetch<{ jobId: UUID }>(`${basePath(applicationSlug)}/github/sync/bootstrap`, { method: 'POST', body: payload })
    },
    getGithubSyncJobStatus(applicationSlug: string, jobId: UUID) {
      return apiFetch<CrmGithubSyncJob>(`${basePath(applicationSlug)}/github/sync/jobs/${jobId}`, { method: 'GET' })
    },
    handleGithubWebhook(payload: unknown, headers: Record<string, string>) {
      return apiFetch<unknown>('/api/v1/crm/github/webhook', { method: 'POST', body: payload, headers })
    },
    createProject(applicationSlug: string, payload: CreateCrmProjectPayload) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects`, { method: 'POST', body: payload })
    },
    replaceProject(applicationSlug: string, id: UUID, payload: ReplaceCrmProjectPayload) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects/${id}`, { method: 'PUT', body: payload })
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
    createProjectWikiPage(applicationSlug: string, id: UUID, payload: CreateCrmProjectWikiPagePayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${id}/wiki-pages`, { method: 'POST', body: payload })
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
    replaceSprint(applicationSlug: string, id: UUID, payload: ReplaceCrmSprintPayload) {
      return apiFetch<CrmSprint>(`${basePath(applicationSlug)}/sprints/${id}`, { method: 'PUT', body: payload })
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
    attachTaskToSprint(applicationSlug: string, sprintId: UUID, taskId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${sprintId}/tasks/${taskId}`, { method: 'PUT' })
    },
    detachTaskFromSprint(applicationSlug: string, sprintId: UUID, taskId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${sprintId}/tasks/${taskId}`, { method: 'DELETE' })
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
    replaceTask(applicationSlug: string, id: UUID, payload: ReplaceCrmTaskPayload) {
      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks/${id}`, { method: 'PUT', body: payload })
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
    replaceTaskRequest(applicationSlug: string, id: UUID, payload: ReplaceCrmTaskRequestPayload) {
      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests/${id}`, { method: 'PUT', body: payload })
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
    getTaskRequestGithubBranches(applicationSlug: string, taskRequestId: UUID) {
      return apiFetch<CrmCollectionResponse<CrmGithubBranch>>(`${basePath(applicationSlug)}/task-requests/${taskRequestId}/github/branches`, { method: 'GET' })
    },
    createTaskRequestGithubBranch(applicationSlug: string, taskRequestId: UUID, payload: CreateCrmTaskRequestGithubBranchPayload) {
      return apiFetch<CrmGithubBranchMutationResponse>(`${basePath(applicationSlug)}/task-requests/${taskRequestId}/github/branches`, { method: 'POST', body: payload })
    },
    deleteTaskRequestGithubBranch(applicationSlug: string, taskRequestId: UUID, branchId: string) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${taskRequestId}/github/branches/${branchId}`, { method: 'DELETE' })
    },
    createEmployee(applicationSlug: string, payload: CreateCrmEmployeePayload) {
      return apiFetch<CrmEmployee>(`${basePath(applicationSlug)}/employees`, { method: 'POST', body: payload })
    },
    getEmployeeById(applicationSlug: string, employeeId: UUID) {
      return apiFetch<CrmEmployee>(`${basePath(applicationSlug)}/employees/${employeeId}`, { method: 'GET' })
    },
    replaceEmployee(applicationSlug: string, employeeId: UUID, payload: ReplaceCrmEmployeePayload) {
      return apiFetch<CrmEmployee>(`${basePath(applicationSlug)}/employees/${employeeId}`, { method: 'PUT', body: payload })
    },
    updateEmployee(applicationSlug: string, employeeId: UUID, payload: UpdateCrmEmployeePayload) {
      return apiFetch<CrmEmployee>(`${basePath(applicationSlug)}/employees/${employeeId}`, { method: 'PATCH', body: payload })
    },
    deleteEmployee(applicationSlug: string, employeeId: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/employees/${employeeId}`, { method: 'DELETE' })
    },
    addEmployeeRole(applicationSlug: string, employeeId: UUID, payload: { roleId: UUID }) {
      return apiFetch<void>(`${basePath(applicationSlug)}/employees/${employeeId}/roles`, { method: 'POST', body: payload })
    },
    detachEmployeeRole(applicationSlug: string, employeeId: UUID, payload: { roleId: UUID }) {
      return apiFetch<void>(`${basePath(applicationSlug)}/employees/${employeeId}/roles`, { method: 'DELETE', body: payload })
    },
    patchEmployeeRole(applicationSlug: string, employeeId: UUID, payload: { roleId: UUID; metadata?: Record<string, unknown> }) {
      return apiFetch<void>(`${basePath(applicationSlug)}/employees/${employeeId}/roles`, { method: 'PATCH', body: payload })
    },
  }
}
