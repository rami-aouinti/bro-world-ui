import { useCrmApi } from '~/composables/api/useCrmApi'
import type { Ref } from 'vue'
import type {
  CrmGithubBranch,
  CrmGithubIssueListItem,
  CrmGithubIssueState,
  CrmGithubProject,
  CrmGithubPullRequestListItem,
  CrmGithubPullRequestState,
  CrmGithubRepository,
} from '~/types/api/crm'

type PaginationState = { page: number, limit: number, totalItems: number, totalPages: number }

type WorkflowLoadingState = {
  repositories: boolean
  pullRequests: boolean
  branches: boolean
  issues: boolean
  projects: boolean
}

type WorkflowErrorState = {
  repositories: string
  pullRequests: string
  branches: string
  issues: string
  projects: string
}

type MaybeRefValue<T> = T | Ref<T>

type UseCrmGithubWorkflowOptions = {
  slug: MaybeRefValue<string>
  projectId: MaybeRefValue<string>
  repository?: Ref<string>
  pullRequestState?: Ref<CrmGithubPullRequestState>
  issueState?: Ref<CrmGithubIssueState>
}

const createPagination = (limit: number): PaginationState => ({ page: 1, limit, totalItems: 0, totalPages: 1 })

const unwrap = <T>(value: MaybeRefValue<T>) => isRef(value) ? value.value : value

export const useCrmGithubWorkflow = (options: UseCrmGithubWorkflowOptions) => {
  const crmApi = useCrmApi()

  const selectedRepository = options.repository ?? ref('')
  const pullRequestState = options.pullRequestState ?? ref<CrmGithubPullRequestState>('open')
  const issueState = options.issueState ?? ref<CrmGithubIssueState>('open')

  const repositories = ref<CrmGithubRepository[]>([])
  const pullRequests = ref<CrmGithubPullRequestListItem[]>([])
  const branches = ref<CrmGithubBranch[]>([])
  const issues = ref<CrmGithubIssueListItem[]>([])
  const githubProjects = ref<CrmGithubProject[]>([])

  const pullRequestsPagination = ref(createPagination(5))
  const branchesPagination = ref(createPagination(5))
  const issuesPagination = ref(createPagination(5))
  const projectsPagination = ref(createPagination(5))

  const isLoading = reactive<WorkflowLoadingState>({
    repositories: false,
    pullRequests: false,
    branches: false,
    issues: false,
    projects: false,
  })

  const errors = reactive<WorkflowErrorState>({
    repositories: '',
    pullRequests: '',
    branches: '',
    issues: '',
    projects: '',
  })

  const clearRepositoryDependentData = () => {
    pullRequests.value = []
    branches.value = []
    issues.value = []
    githubProjects.value = []
    pullRequestsPagination.value = createPagination(pullRequestsPagination.value.limit)
    branchesPagination.value = createPagination(branchesPagination.value.limit)
    issuesPagination.value = createPagination(issuesPagination.value.limit)
    projectsPagination.value = createPagination(projectsPagination.value.limit)
    errors.pullRequests = ''
    errors.branches = ''
    errors.issues = ''
    errors.projects = ''
  }

  const loadRepositories = async () => {
    const slug = unwrap(options.slug)
    const projectId = unwrap(options.projectId)
    if (!slug || !projectId) {
      repositories.value = []
      selectedRepository.value = ''
      clearRepositoryDependentData()
      return
    }

    isLoading.repositories = true
    errors.repositories = ''

    try {
      const response = await crmApi.getProjectGithubRepositories(slug, projectId)
      repositories.value = response.items ?? []

      if (!repositories.value.some(item => item.fullName === selectedRepository.value)) {
        selectedRepository.value = repositories.value[0]?.fullName ?? ''
      }

      if (!selectedRepository.value) {
        clearRepositoryDependentData()
      }
    }
    catch {
      errors.repositories = 'Impossible de charger les repositories GitHub.'
      repositories.value = []
      selectedRepository.value = ''
      clearRepositoryDependentData()
    }
    finally {
      isLoading.repositories = false
    }
  }

  const loadPullRequests = async (page = 1) => {
    const slug = unwrap(options.slug)
    const projectId = unwrap(options.projectId)
    if (!slug || !projectId || !selectedRepository.value) {
      pullRequests.value = []
      pullRequestsPagination.value = createPagination(pullRequestsPagination.value.limit)
      return
    }

    isLoading.pullRequests = true
    errors.pullRequests = ''

    try {
      const response = await crmApi.getProjectGithubPullRequests(slug, projectId, {
        repo: selectedRepository.value,
        state: pullRequestState.value,
        page,
        limit: pullRequestsPagination.value.limit,
      })
      pullRequests.value = response.items ?? []
      pullRequestsPagination.value = response.pagination ?? pullRequestsPagination.value
    }
    catch {
      errors.pullRequests = 'Impossible de charger la liste des pull requests.'
      pullRequests.value = []
    }
    finally {
      isLoading.pullRequests = false
    }
  }

  const loadBranches = async (page = 1) => {
    const slug = unwrap(options.slug)
    const projectId = unwrap(options.projectId)
    if (!slug || !projectId || !selectedRepository.value) {
      branches.value = []
      branchesPagination.value = createPagination(branchesPagination.value.limit)
      return
    }

    isLoading.branches = true
    errors.branches = ''

    try {
      const response = await crmApi.getProjectGithubBranches(slug, projectId, {
        repo: selectedRepository.value,
        page,
        limit: branchesPagination.value.limit,
      })
      branches.value = response.items ?? []
      branchesPagination.value = response.pagination ?? branchesPagination.value
    }
    catch {
      errors.branches = 'Impossible de charger les branches.'
      branches.value = []
    }
    finally {
      isLoading.branches = false
    }
  }

  const loadIssues = async (page = 1) => {
    const slug = unwrap(options.slug)
    const projectId = unwrap(options.projectId)
    if (!slug || !projectId || !selectedRepository.value) {
      issues.value = []
      issuesPagination.value = createPagination(issuesPagination.value.limit)
      return
    }

    isLoading.issues = true
    errors.issues = ''

    try {
      const response = await crmApi.getProjectGithubIssues(slug, projectId, {
        repo: selectedRepository.value,
        state: issueState.value,
        page,
        limit: issuesPagination.value.limit,
      })
      issues.value = response.items ?? []
      issuesPagination.value = response.pagination ?? issuesPagination.value
    }
    catch {
      errors.issues = 'Impossible de charger la liste des issues.'
      issues.value = []
    }
    finally {
      isLoading.issues = false
    }
  }

  const loadGithubProjects = async (page = 1) => {
    const slug = unwrap(options.slug)
    const projectId = unwrap(options.projectId)
    if (!slug || !projectId || !selectedRepository.value) {
      githubProjects.value = []
      projectsPagination.value = createPagination(projectsPagination.value.limit)
      return
    }

    isLoading.projects = true
    errors.projects = ''

    try {
      const response = await crmApi.getProjectGithubProjects(slug, projectId, {
        repo: selectedRepository.value,
        page,
        limit: projectsPagination.value.limit,
      })
      githubProjects.value = response.items ?? []
      projectsPagination.value = response.pagination ?? projectsPagination.value
    }
    catch {
      errors.projects = 'Impossible de charger les projets GitHub.'
      githubProjects.value = []
    }
    finally {
      isLoading.projects = false
    }
  }

  const loadAllRepositoryData = async () => {
    if (!selectedRepository.value) {
      clearRepositoryDependentData()
      return
    }
    await Promise.all([loadPullRequests(1), loadBranches(1), loadIssues(1), loadGithubProjects(1)])
  }

  return {
    selectedRepository,
    pullRequestState,
    issueState,
    repositories,
    pullRequests,
    branches,
    issues,
    githubProjects,
    pullRequestsPagination,
    branchesPagination,
    issuesPagination,
    projectsPagination,
    isLoading,
    errors,
    clearRepositoryDependentData,
    loadRepositories,
    loadPullRequests,
    loadBranches,
    loadIssues,
    loadGithubProjects,
    loadAllRepositoryData,
  }
}
