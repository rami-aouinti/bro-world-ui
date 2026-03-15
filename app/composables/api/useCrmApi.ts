import { useApiClient } from '../useApiClient'
import type { UUID } from '~/types/api/common'
import type {
  CreateCrmCompanyPayload,
  CreateCrmProjectPayload,
  CreateCrmSprintPayload,
  CreateCrmTaskPayload,
  CreateCrmTaskRequestPayload,
  CrmCollectionResponse,
  CrmCompany,
  CrmDashboardResponse,
  CrmProject,
  CrmPublicUsersResponse,
  CrmReportsResponse,
  CrmSprint,
  CrmTask,
  CrmTaskListResponse,
  CrmTaskRequest,
  CrmTasksBySprintResponse,
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

    getDashboard(applicationSlug: string) {
      return apiFetch<CrmDashboardResponse>(`${basePath(applicationSlug)}/dashboard`, { method: 'GET' })
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
    updateTaskRequestStatus(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/status`, { method: 'PATCH', body: payload })
    },
    updateTaskRequestStatusPut(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/status`, { method: 'PUT', body: payload })
    },
  }
}
