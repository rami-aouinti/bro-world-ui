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
  CrmSprint,
  CrmTask,
  CrmTaskListResponse,
  CrmTaskRequest,
  UpdateCrmTaskRequestStatusPayload,
} from '~/types/api/crm'

export const useCrmApi = () => {
  const { apiFetch } = useApiClient()

  const basePath = (applicationSlug: string) => `/api/v1/crm/applications/${applicationSlug}`

  return {
    getCompanies(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmCompany>>(`${basePath(applicationSlug)}/companies`, { method: 'GET' })
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
    getProjects(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmProject>>(`${basePath(applicationSlug)}/projects`, { method: 'GET' })
    },
    createProject(applicationSlug: string, payload: CreateCrmProjectPayload) {
      return apiFetch<CrmProject>(`${basePath(applicationSlug)}/projects`, { method: 'POST', body: payload })
    },
    deleteProject(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/projects/${id}`, { method: 'DELETE' })
    },
    getSprints(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmSprint>>(`${basePath(applicationSlug)}/sprints`, { method: 'GET' })
    },
    createSprint(applicationSlug: string, payload: CreateCrmSprintPayload) {
      return apiFetch<CrmSprint>(`${basePath(applicationSlug)}/sprints`, { method: 'POST', body: payload })
    },
    deleteSprint(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/sprints/${id}`, { method: 'DELETE' })
    },
    getTasks(applicationSlug: string) {
      return apiFetch<CrmTaskListResponse>(`${basePath(applicationSlug)}/tasks`, { method: 'GET' })
    },
    getMyTasks(applicationSlug: string) {
      return apiFetch<CrmTaskListResponse>(`${basePath(applicationSlug)}/me/tasks`, { method: 'GET' })
    },
    createTask(applicationSlug: string, payload: CreateCrmTaskPayload) {
      return apiFetch<CrmTask>(`${basePath(applicationSlug)}/tasks`, { method: 'POST', body: payload })
    },
    deleteTask(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/tasks/${id}`, { method: 'DELETE' })
    },
    getTaskRequests(applicationSlug: string) {
      return apiFetch<CrmCollectionResponse<CrmTaskRequest>>(`${basePath(applicationSlug)}/task-requests`, { method: 'GET' })
    },
    createTaskRequest(applicationSlug: string, payload: CreateCrmTaskRequestPayload) {
      return apiFetch<CrmTaskRequest>(`${basePath(applicationSlug)}/task-requests`, { method: 'POST', body: payload })
    },
    deleteTaskRequest(applicationSlug: string, id: UUID) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}`, { method: 'DELETE' })
    },
    updateTaskRequestStatus(applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) {
      return apiFetch<void>(`${basePath(applicationSlug)}/task-requests/${id}/status`, { method: 'PATCH', body: payload })
    },
  }
}
