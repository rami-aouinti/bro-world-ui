import { defineStore } from 'pinia'
import { useCrmApi } from '~/composables/api/useCrmApi'
import type {
  CreateCrmCompanyPayload,
  CreateCrmProjectPayload,
  CrmCompany,
  CrmDashboardResponse,
  CrmProject,
  CrmSprint,
  CrmTask,
  CrmTaskRequest,
} from '~/types/api/crm'

const CACHE_TTL_MS = 60_000

interface CrmApplicationCache {
  fetchedAt: number
  companies: CrmCompany[]
  dashboard: CrmDashboardResponse | null
  projects: CrmProject[]
  sprints: CrmSprint[]
  tasks: CrmTask[]
  taskRequests: CrmTaskRequest[]
}

const createEmptyCache = (): CrmApplicationCache => ({
  fetchedAt: 0,
  companies: [],
  dashboard: null,
  projects: [],
  sprints: [],
  tasks: [],
  taskRequests: [],
})

export const useCrmStore = defineStore('crm', () => {
  const crmApi = useCrmApi()
  const tracker = useTracker()
  const byApplication = ref<Record<string, CrmApplicationCache>>({})
  const isLoading = ref(false)

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

  const getCompanies = (applicationSlug: string) => ensureApplicationCache(applicationSlug).companies
  const getDashboard = (applicationSlug: string) => ensureApplicationCache(applicationSlug).dashboard
  const getProjects = (applicationSlug: string) => ensureApplicationCache(applicationSlug).projects
  const getSprints = (applicationSlug: string) => ensureApplicationCache(applicationSlug).sprints

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


  const createCompany = async (applicationSlug: string, payload: CreateCrmCompanyPayload) => {
    const created = await crmApi.createCompany(applicationSlug, payload)
    const cache = ensureApplicationCache(applicationSlug)
    cache.companies = [created, ...cache.companies]
    tracker.track('crm.entity.created', {
      applicationSlug,
      entityType: 'company',
      entityId: created.id,
    })
    return created
  }

  const createProject = async (applicationSlug: string, payload: CreateCrmProjectPayload) => {
    const created = await crmApi.createProject(applicationSlug, payload)
    const cache = ensureApplicationCache(applicationSlug)
    cache.projects = [created, ...cache.projects]
    tracker.track('crm.entity.created', {
      applicationSlug,
      entityType: 'project',
      entityId: created.id,
    })
    return created
  }

  return {
    byApplication,
    isLoading,
    getCompanies,
    getDashboard,
    getProjects,
    getSprints,
    fetchCompanies,
    fetchDashboard,
    fetchProjects,
    fetchSprints,
    fetchTasks,
    fetchTaskRequests,
    createCompany,
    createProject,
  }
})
