import { defineStore } from 'pinia'
import { useCrmApi } from '~/composables/api/useCrmApi'
import type {
  CreateCrmCompanyPayload,
  CreateCrmContactPayload,
  CreateCrmProjectPayload,
  CreateCrmSprintPayload,
  CreateCrmTaskPayload,
  CreateCrmTaskRequestPayload,
  CrmCompany,
  CrmContact,
  CrmEmployee,
  CrmDashboardResponse,
  CrmProject,
  CrmPublicUser,
  CrmSprint,
  CrmTask,
  CrmTaskRequest,
  UpdateCrmProjectPayload,
  UpdateCrmSprintPayload,
  UpdateCrmTaskPayload,
  UpdateCrmTaskRequestPayload,
  UpdateCrmTaskRequestStatusPayload,
  UpdateCrmContactPayload,
} from '~/types/api/crm'
import type { UUID } from '~/types/api/common'

const CACHE_TTL_MS = 60_000

interface CrmApplicationCache {
  fetchedAt: number
  companies: CrmCompany[]
  contacts: CrmContact[]
  dashboard: CrmDashboardResponse | null
  projects: CrmProject[]
  sprints: CrmSprint[]
  tasks: CrmTask[]
  myTasks: CrmTask[]
  taskRequests: CrmTaskRequest[]
}


type CrmCacheScope =
  | 'companies'
  | 'contacts'
  | 'dashboard'
  | 'projects'
  | 'sprints'
  | 'tasks'
  | 'myTasks'
  | 'taskRequests'
  | 'employees'

const createEmptyCache = (): CrmApplicationCache => ({
  fetchedAt: 0,
  companies: [],
  contacts: [],
  dashboard: null,
  projects: [],
  sprints: [],
  tasks: [],
  myTasks: [],
  taskRequests: [],
})

export const useCrmStore = defineStore('crm', () => {
  const crmApi = useCrmApi()
  const tracker = useTracker()
  const byApplication = ref<Record<string, CrmApplicationCache>>({})
  const isLoading = ref(false)
  const publicUsers = ref<CrmPublicUser[]>([])
  const employeesByApplication = ref<Record<string, CrmEmployee[]>>({})

  const ensureApplicationCache = (applicationSlug: string) => {
    if (!byApplication.value[applicationSlug]) {
      byApplication.value[applicationSlug] = createEmptyCache()
    }

    return byApplication.value[applicationSlug]
  }

  const shouldFetch = (applicationSlug: string, force = false) => {
    if (force) {
      return true
    }

    const cache = ensureApplicationCache(applicationSlug)
    return Date.now() - cache.fetchedAt > CACHE_TTL_MS
  }

  const markFetched = (applicationSlug: string) => {
    ensureApplicationCache(applicationSlug).fetchedAt = Date.now()
  }

  const invalidateApplicationCache = (applicationSlug: string, scopes: CrmCacheScope[]) => {
    const cache = ensureApplicationCache(applicationSlug)

    for (const scope of scopes) {
      if (scope === 'companies') {
        cache.companies = []
      }

      if (scope === 'contacts') {
        cache.contacts = []
      }

      if (scope === 'dashboard') {
        cache.dashboard = null
      }

      if (scope === 'projects') {
        cache.projects = []
      }

      if (scope === 'sprints') {
        cache.sprints = []
      }

      if (scope === 'tasks') {
        cache.tasks = []
      }

      if (scope === 'myTasks') {
        cache.myTasks = []
      }

      if (scope === 'taskRequests') {
        cache.taskRequests = []
      }

      if (scope === 'employees') {
        delete employeesByApplication.value[applicationSlug]
      }
    }

    cache.fetchedAt = 0
  }

  const getCompanies = (applicationSlug: string) => ensureApplicationCache(applicationSlug).companies
  const getDashboard = (applicationSlug: string) => ensureApplicationCache(applicationSlug).dashboard
  const getContacts = (applicationSlug: string) => ensureApplicationCache(applicationSlug).contacts
  const getProjects = (applicationSlug: string) => ensureApplicationCache(applicationSlug).projects
  const getSprints = (applicationSlug: string) => ensureApplicationCache(applicationSlug).sprints
  const getTasks = (applicationSlug: string) => ensureApplicationCache(applicationSlug).tasks
  const getMyTasks = (applicationSlug: string) => ensureApplicationCache(applicationSlug).myTasks
  const getPublicUsers = () => publicUsers.value
  const getEmployees = (applicationSlug: string) => employeesByApplication.value[applicationSlug] ?? []

  const fetchCompanies = async (applicationSlug: string, force = false) => {
    if (!shouldFetch(applicationSlug, force) && getCompanies(applicationSlug).length > 0) {
      return getCompanies(applicationSlug)
    }

    isLoading.value = true
    try {
      const response = await crmApi.getCompanies(applicationSlug)
      ensureApplicationCache(applicationSlug).companies = response.items
      markFetched(applicationSlug)
      tracker.track('crm.companies.loaded', { applicationSlug, count: response.items.length })
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchDashboard = async (applicationSlug: string, force = false) => {
    if (!shouldFetch(applicationSlug, force) && getDashboard(applicationSlug)) {
      return getDashboard(applicationSlug)
    }

    isLoading.value = true
    try {
      const response = await crmApi.getDashboard(applicationSlug)
      ensureApplicationCache(applicationSlug).dashboard = response
      markFetched(applicationSlug)
      return response
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchContacts = async (applicationSlug: string, force = false) => {
    if (!shouldFetch(applicationSlug, force) && getContacts(applicationSlug).length > 0) {
      return getContacts(applicationSlug)
    }

    isLoading.value = true
    try {
      const response = await crmApi.getContacts(applicationSlug)
      ensureApplicationCache(applicationSlug).contacts = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchProjects = async (applicationSlug: string, force = false) => {
    if (!shouldFetch(applicationSlug, force) && getProjects(applicationSlug).length > 0) {
      return getProjects(applicationSlug)
    }

    isLoading.value = true
    try {
      const response = await crmApi.getProjects(applicationSlug)
      ensureApplicationCache(applicationSlug).projects = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchSprints = async (applicationSlug: string, force = false) => {
    if (!shouldFetch(applicationSlug, force) && getSprints(applicationSlug).length > 0) {
      return getSprints(applicationSlug)
    }

    isLoading.value = true
    try {
      const response = await crmApi.getSprints(applicationSlug)
      ensureApplicationCache(applicationSlug).sprints = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchTasks = async (applicationSlug: string, force = false) => {
    const cache = ensureApplicationCache(applicationSlug)
    if (!shouldFetch(applicationSlug, force) && cache.tasks.length > 0) {
      return cache.tasks
    }

    isLoading.value = true
    try {
      const response = await crmApi.getTasks(applicationSlug)
      cache.tasks = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchMyTasks = async (applicationSlug: string, force = false) => {
    const cache = ensureApplicationCache(applicationSlug)
    if (!shouldFetch(applicationSlug, force) && cache.myTasks.length > 0) {
      return cache.myTasks
    }

    isLoading.value = true
    try {
      const response = await crmApi.getMyTasks(applicationSlug)
      cache.myTasks = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchTaskRequests = async (applicationSlug: string, force = false) => {
    const cache = ensureApplicationCache(applicationSlug)
    if (!shouldFetch(applicationSlug, force) && cache.taskRequests.length > 0) {
      return cache.taskRequests
    }

    isLoading.value = true
    try {
      const response = await crmApi.getTaskRequests(applicationSlug)
      cache.taskRequests = response.items
      markFetched(applicationSlug)
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }


  const fetchEmployees = async (applicationSlug: string, force = false) => {
    if (!force && (employeesByApplication.value[applicationSlug]?.length ?? 0) > 0) {
      return employeesByApplication.value[applicationSlug]
    }

    isLoading.value = true
    try {
      const response = await crmApi.getEmployees(applicationSlug)
      employeesByApplication.value[applicationSlug] = response.items
      return response.items
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchPublicUsers = async (force = false) => {
    if (!force && publicUsers.value.length > 0) {
      return publicUsers.value
    }

    isLoading.value = true
    try {
      const response = await crmApi.getPublicUsers()
      publicUsers.value = response.users
      return publicUsers.value
    }
    finally {
      isLoading.value = false
    }
  }

  const fetchCompanyById = (applicationSlug: string, id: UUID) => crmApi.getCompanyById(applicationSlug, id)
  const fetchContactById = (applicationSlug: string, id: UUID) => crmApi.getContactById(applicationSlug, id)
  const fetchProjectById = (applicationSlug: string, id: UUID) => crmApi.getProjectById(applicationSlug, id)
  const fetchSprintById = (applicationSlug: string, id: UUID) => crmApi.getSprintById(applicationSlug, id)
  const fetchTaskById = (applicationSlug: string, id: UUID) => crmApi.getTaskById(applicationSlug, id)
  const fetchTaskRequestById = (applicationSlug: string, id: UUID) => crmApi.getTaskRequestById(applicationSlug, id)
  const fetchSprintTasks = (applicationSlug: string, sprintId: UUID) => crmApi.getSprintTasks(applicationSlug, sprintId)
  const fetchTasksBySprint = (applicationSlug: string) => crmApi.getTasksBySprint(applicationSlug)


  const assignTaskAssignee = async (applicationSlug: string, taskId: UUID, userId: UUID) => {
    await crmApi.assignTaskAssignee(applicationSlug, taskId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)
    const user = publicUsers.value.find(candidate => candidate.id === userId)

    if (!user) {
      return
    }

    cache.tasks = cache.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            assignees: task.assignees.some(assignee => assignee.id === userId)
              ? task.assignees
              : [...task.assignees, user],
          }
        : task,
    )
  }

  const removeTaskAssignee = async (applicationSlug: string, taskId: UUID, userId: UUID) => {
    await crmApi.removeTaskAssignee(applicationSlug, taskId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)

    cache.tasks = cache.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            assignees: task.assignees.filter(assignee => assignee.id !== userId),
          }
        : task,
    )
  }

  const assignTaskRequestAssignee = async (applicationSlug: string, requestId: UUID, userId: UUID) => {
    await crmApi.assignTaskRequestAssignee(applicationSlug, requestId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    const user = publicUsers.value.find(candidate => candidate.id === userId)

    if (!user) {
      return
    }

    const updateChildren = (tasks: CrmTask[]) => tasks.map(task => ({
      ...task,
      children: task.children.map(child =>
        child.id === requestId
          ? {
              ...child,
              assignees: child.assignees.some(assignee => assignee.id === userId)
                ? child.assignees
                : [...child.assignees, user],
            }
          : child,
      ),
    }))

    cache.tasks = updateChildren(cache.tasks)
    cache.myTasks = updateChildren(cache.myTasks)
  }

  const removeTaskRequestAssignee = async (applicationSlug: string, requestId: UUID, userId: UUID) => {
    await crmApi.removeTaskRequestAssignee(applicationSlug, requestId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)

    const updateChildren = (tasks: CrmTask[]) => tasks.map(task => ({
      ...task,
      children: task.children.map(child =>
        child.id === requestId
          ? {
              ...child,
              assignees: child.assignees.filter(assignee => assignee.id !== userId),
            }
          : child,
      ),
    }))

    cache.tasks = updateChildren(cache.tasks)
    cache.myTasks = updateChildren(cache.myTasks)
  }

  const createCompany = async (applicationSlug: string, payload: CreateCrmCompanyPayload) => {
    const created = await crmApi.createCompany(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'companies', 'contacts', 'projects'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.companies = [created, ...cache.companies]
    tracker.track('crm.entity.created', {
      applicationSlug,
      entityType: 'company',
      entityId: created.id,
    })
    return created
  }

  const deleteCompany = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteCompany(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'companies', 'contacts', 'projects'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.companies = cache.companies.filter(company => company.id !== id)
  }

  const createContact = async (applicationSlug: string, payload: CreateCrmContactPayload) => {
    const created = await crmApi.createContact(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'contacts', 'companies'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.contacts = [created, ...cache.contacts]
    tracker.track('crm.entity.created', {
      applicationSlug,
      entityType: 'contact',
      entityId: created.id,
    })
    return created
  }

  const updateContact = async (applicationSlug: string, id: UUID, payload: UpdateCrmContactPayload) => {
    const updated = await crmApi.updateContact(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'contacts', 'companies'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.contacts = cache.contacts.map(contact => contact.id === id ? updated : contact)
    return updated
  }

  const deleteContact = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteContact(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'contacts', 'companies'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.contacts = cache.contacts.filter(contact => contact.id !== id)
  }

  const createProject = async (applicationSlug: string, payload: CreateCrmProjectPayload) => {
    const created = await crmApi.createProject(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects', 'sprints', 'tasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.projects = [created, ...cache.projects]
    tracker.track('crm.entity.created', {
      applicationSlug,
      entityType: 'project',
      entityId: created.id,
    })
    return created
  }

  const updateProject = async (applicationSlug: string, id: UUID, payload: UpdateCrmProjectPayload) => {
    const updated = await crmApi.updateProject(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects', 'sprints', 'tasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.projects = cache.projects.map(project => project.id === id ? updated : project)
    return updated
  }

  const assignProjectAssignee = async (applicationSlug: string, projectId: UUID, userId: UUID) => {
    await crmApi.assignProjectAssignee(applicationSlug, projectId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects', 'employees'])
  }

  const removeProjectAssignee = async (applicationSlug: string, projectId: UUID, userId: UUID) => {
    await crmApi.removeProjectAssignee(applicationSlug, projectId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects', 'employees'])
  }

  const deleteProject = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteProject(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects', 'sprints', 'tasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.projects = cache.projects.filter(project => project.id !== id)
  }


  const uploadProjectFiles = async (applicationSlug: string, id: UUID, files: File[]) => {
    const response = await crmApi.uploadProjectFiles(applicationSlug, id, files)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'projects'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.projects = cache.projects.map(project => project.id === id
      ? { ...project, attachments: [...(project.attachments ?? []), ...response.files] }
      : project)

    return response.files
  }

  const createSprint = async (applicationSlug: string, payload: CreateCrmSprintPayload) => {
    const created = await crmApi.createSprint(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'sprints', 'tasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.sprints = [created, ...cache.sprints]
    return created
  }

  const updateSprint = async (applicationSlug: string, id: UUID, payload: UpdateCrmSprintPayload) => {
    const updated = await crmApi.updateSprint(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'sprints', 'tasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.sprints = cache.sprints.map(sprint => sprint.id === id ? updated : sprint)
    return updated
  }

  const assignSprintAssignee = async (applicationSlug: string, sprintId: UUID, userId: UUID) => {
    await crmApi.assignSprintAssignee(applicationSlug, sprintId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'sprints', 'employees'])
  }

  const removeSprintAssignee = async (applicationSlug: string, sprintId: UUID, userId: UUID) => {
    await crmApi.removeSprintAssignee(applicationSlug, sprintId, userId)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'sprints', 'employees'])
  }

  const deleteSprint = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteSprint(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'sprints', 'tasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.sprints = cache.sprints.filter(sprint => sprint.id !== id)
  }

  const createTask = async (applicationSlug: string, payload: CreateCrmTaskPayload) => {
    const created = await crmApi.createTask(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks', 'taskRequests', 'sprints'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.tasks = [created, ...cache.tasks]
    return created
  }

  const updateTask = async (applicationSlug: string, id: UUID, payload: UpdateCrmTaskPayload) => {
    const updated = await crmApi.updateTask(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks', 'taskRequests'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.tasks = cache.tasks.map(task => task.id === id ? updated : task)
    cache.myTasks = cache.myTasks.map(task => task.id === id ? updated : task)
    return updated
  }

  const deleteTask = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteTask(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks', 'taskRequests', 'sprints'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.tasks = cache.tasks.filter(task => task.id !== id)
    cache.myTasks = cache.myTasks.filter(task => task.id !== id)
  }


  const uploadTaskFiles = async (applicationSlug: string, id: UUID, files: File[]) => {
    const updated = await crmApi.uploadTaskFiles(applicationSlug, id, files)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.tasks = cache.tasks.map(task => task.id === id ? updated : task)
    cache.myTasks = cache.myTasks.map(task => task.id === id ? updated : task)
    return updated
  }

  const createTaskRequest = async (applicationSlug: string, payload: CreateCrmTaskRequestPayload) => {
    const created = await crmApi.createTaskRequest(applicationSlug, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'taskRequests', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.taskRequests = [created, ...cache.taskRequests]
    return created
  }

  const deleteTaskRequest = async (applicationSlug: string, id: UUID) => {
    await crmApi.deleteTaskRequest(applicationSlug, id)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'taskRequests', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.taskRequests = cache.taskRequests.filter(request => request.id !== id)

    const removeChildren = (tasks: CrmTask[]) => tasks.map(task => ({
      ...task,
      children: task.children.filter(child => child.id !== id),
    }))

    cache.tasks = removeChildren(cache.tasks)
    cache.myTasks = removeChildren(cache.myTasks)
  }

  const updateTaskRequest = async (applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestPayload) => {
    const updated = await crmApi.updateTaskRequest(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'taskRequests', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)
    cache.taskRequests = cache.taskRequests.map(request => request.id === id ? updated : request)
    return updated
  }


  const uploadTaskRequestFiles = async (applicationSlug: string, id: UUID, files: File[]) => {
    const updated = await crmApi.uploadTaskRequestFiles(applicationSlug, id, files)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'taskRequests', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)

    const updateChildren = (tasks: CrmTask[]) => tasks.map(task => ({
      ...task,
      children: task.children.map(child => child.id === id ? { ...child, attachments: updated.attachments } : child),
    }))

    cache.tasks = updateChildren(cache.tasks)
    cache.myTasks = updateChildren(cache.myTasks)
    cache.taskRequests = cache.taskRequests.map(request => request.id === id ? updated : request)

    return updated
  }

  const updateTaskRequestStatus = async (applicationSlug: string, id: UUID, payload: UpdateCrmTaskRequestStatusPayload) => {
    await crmApi.updateTaskRequestStatus(applicationSlug, id, payload)
    invalidateApplicationCache(applicationSlug, ['dashboard', 'taskRequests', 'tasks', 'myTasks'])
    const cache = ensureApplicationCache(applicationSlug)

    const updateChildren = (tasks: CrmTask[]) => tasks.map((task) => ({
      ...task,
      children: task.children.map(child => child.id === id ? { ...child, status: payload.status } : child),
    }))

    cache.tasks = updateChildren(cache.tasks)
    cache.myTasks = updateChildren(cache.myTasks)
    cache.taskRequests = cache.taskRequests.map(request => request.id === id ? { ...request, status: payload.status } : request)
  }

  return {
    byApplication,
    isLoading,
    publicUsers,
    employeesByApplication,
    getCompanies,
    getDashboard,
    getContacts,
    getProjects,
    getSprints,
    getTasks,
    getMyTasks,
    getPublicUsers,
    getEmployees,
    fetchCompanies,
    fetchDashboard,
    fetchContacts,
    fetchProjects,
    fetchSprints,
    fetchTasks,
    fetchMyTasks,
    fetchTaskRequests,
    fetchEmployees,
    fetchPublicUsers,
    fetchCompanyById,
    fetchContactById,
    fetchProjectById,
    fetchSprintById,
    fetchTaskById,
    fetchTaskRequestById,
    fetchSprintTasks,
    fetchTasksBySprint,
    invalidateApplicationCache,
    createCompany,
    deleteCompany,
    createContact,
    updateContact,
    deleteContact,
    createProject,
    updateProject,
    assignProjectAssignee,
    removeProjectAssignee,
    deleteProject,
    uploadProjectFiles,
    createSprint,
    updateSprint,
    assignSprintAssignee,
    removeSprintAssignee,
    deleteSprint,
    createTask,
    updateTask,
    deleteTask,
    uploadTaskFiles,
    assignTaskAssignee,
    removeTaskAssignee,
    assignTaskRequestAssignee,
    removeTaskRequestAssignee,
    createTaskRequest,
    updateTaskRequest,
    deleteTaskRequest,
    uploadTaskRequestFiles,
    updateTaskRequestStatus,
  }
})
