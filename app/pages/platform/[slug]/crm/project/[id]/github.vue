<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import type {
  CreateCrmGithubBranchPayload,
  CreateCrmGithubProjectPayload,
  CreateCrmGithubRepositoryPayload,
  CreateCrmGithubIssuePayload,
  CrmGithubBranch,
  CrmGithubIssueDetails,
  CrmGithubIssueListItem,
  CrmGithubIssueState,
  CrmGithubProject,
  CrmGithubProjectItem,
  CrmGithubPullRequestDetails,
  CrmGithubPullRequestListItem,
  CrmGithubPullRequestState,
  CrmGithubRepository,
} from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const projectId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const repositories = ref<CrmGithubRepository[]>([])
const selectedRepo = ref('')
const pullRequestState = ref<CrmGithubPullRequestState>('open')
const pullRequests = ref<CrmGithubPullRequestListItem[]>([])
const pullRequestsPagination = ref({ page: 1, limit: 30, totalItems: 0, totalPages: 1 })
const branches = ref<CrmGithubBranch[]>([])
const branchesPagination = ref({ page: 1, limit: 30, totalItems: 0, totalPages: 1 })
const selectedPullRequest = ref<CrmGithubPullRequestDetails | null>(null)
const issueState = ref<CrmGithubIssueState>('all')
const issues = ref<CrmGithubIssueListItem[]>([])
const issuesPagination = ref({ page: 1, limit: 30, totalItems: 0, totalPages: 1 })
const selectedIssue = ref<CrmGithubIssueDetails | null>(null)
const projects = ref<CrmGithubProject[]>([])
const projectsPagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 1 })
const selectedGithubProject = ref<CrmGithubProject | null>(null)
const selectedGithubProjectItems = ref<CrmGithubProjectItem[]>([])
const projectItemsPagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 1 })
const issueForm = reactive<CreateCrmGithubIssuePayload>({
  repository: '',
  title: '',
  body: '',
})
const githubProjectForm = reactive<CreateCrmGithubProjectPayload>({
  owner: '',
  title: '',
})
const githubRepositoryForm = reactive<CreateCrmGithubRepositoryPayload>({
  name: '',
  description: '',
  private: true,
})
const branchForm = reactive<CreateCrmGithubBranchPayload>({
  repository: '',
  name: '',
  sourceBranch: 'master',
})
const isCreatingIssue = ref(false)
const selectedDetailType = ref<'pull-request' | 'issue' | 'project'>('pull-request')
const workspaceTab = ref<'pull-requests' | 'issues' | 'branches' | 'projects'>('pull-requests')
const dashboard = ref<{ open: number; closed: number; merged: number } | null>(null)
const pullRequestStateOptions = [
  { title: 'Open', value: 'open' },
  { title: 'Closed', value: 'closed' },
  { title: 'Close', value: 'close' },
] satisfies Array<{ title: string; value: CrmGithubPullRequestState }>
const issueStateOptions = [
  { title: 'All', value: 'all' },
  { title: 'Open', value: 'open' },
  { title: 'Closed', value: 'closed' },
] satisfies Array<{ title: string; value: CrmGithubIssueState }>

const isLoading = reactive({
  repositories: false,
  dashboard: false,
  pullRequests: false,
  branches: false,
  issues: false,
  projects: false,
  projectItems: false,
  pullRequestDetails: false,
  issueDetails: false,
  createGithubProject: false,
  createGithubRepository: false,
  createBranch: false,
  deleteBranch: false,
})
const errors = reactive({
  repositories: '',
  dashboard: '',
  pullRequests: '',
  branches: '',
  issues: '',
  projects: '',
  projectItems: '',
  pullRequestDetails: '',
  issueDetails: '',
  createIssue: '',
  createGithubProject: '',
  createGithubRepository: '',
  createBranch: '',
  deleteBranch: '',
})

const formatDate = (date?: string | null) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

const pullRequestStatusColor = (state: CrmGithubPullRequestState, mergedAt: string | null) => {
  if (state === 'open') return 'info'
  if (mergedAt) return 'success'
  return 'default'
}

const issueStatusColor = (state: string) => state === 'open' ? 'info' : 'default'

const normalizeGithubIssue = (issue: Record<string, any>): CrmGithubIssueDetails => ({
  number: Number(issue.number ?? 0),
  title: String(issue.title ?? ''),
  state: String(issue.state ?? 'open') as CrmGithubIssueDetails['state'],
  body: issue.body ?? null,
  author: String(issue.author ?? issue.user?.login ?? ''),
  comments: Number(issue.comments ?? 0),
  htmlUrl: String(issue.htmlUrl ?? issue.html_url ?? ''),
  createdAt: String(issue.createdAt ?? issue.created_at ?? ''),
  updatedAt: String(issue.updatedAt ?? issue.updated_at ?? ''),
})

const loadRepositories = async () => {
  if (!slug.value || !projectId.value) return
  isLoading.repositories = true
  errors.repositories = ''
  try {
    const response = await crmApi.getProjectGithubRepositories(slug.value, projectId.value)
    repositories.value = response.items
    const queryRepo = String(route.query.repo ?? '')
    selectedRepo.value = repositories.value.some(item => item.fullName === queryRepo) ? queryRepo : (repositories.value[0]?.fullName ?? '')
  }
  catch {
    errors.repositories = 'Impossible de charger les repositories GitHub.'
  }
  finally {
    isLoading.repositories = false
  }
}

const loadDashboard = async () => {
  if (!slug.value || !projectId.value) return
  isLoading.dashboard = true
  errors.dashboard = ''
  try {
    const response = await crmApi.getProjectGithubDashboard(slug.value, projectId.value)
    dashboard.value = response.pullRequests
    if (!repositories.value.length) {
      repositories.value = response.repositories
    }
  }
  catch {
    errors.dashboard = 'Impossible de charger le dashboard GitHub.'
  }
  finally {
    isLoading.dashboard = false
  }
}

const loadPullRequests = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.pullRequests = true
  errors.pullRequests = ''
  try {
    const response = await crmApi.getProjectGithubPullRequests(slug.value, projectId.value, {
      repo: selectedRepo.value,
      state: pullRequestState.value,
      page,
      limit: pullRequestsPagination.value.limit,
    })
    pullRequests.value = response.items
    pullRequestsPagination.value = response.pagination ?? pullRequestsPagination.value
  }
  catch {
    errors.pullRequests = 'Impossible de charger la liste des pull requests.'
  }
  finally {
    isLoading.pullRequests = false
  }
}

const loadBranches = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.branches = true
  errors.branches = ''
  try {
    const response = await crmApi.getProjectGithubBranches(slug.value, projectId.value, {
      repo: selectedRepo.value,
      page,
      limit: branchesPagination.value.limit,
    })
    branches.value = response.items
    branchesPagination.value = response.pagination ?? branchesPagination.value
    if (!branchForm.sourceBranch || !branches.value.some(branch => branch.name === branchForm.sourceBranch)) {
      branchForm.sourceBranch = branches.value.some(branch => branch.name === 'master')
        ? 'master'
        : (branches.value[0]?.name ?? 'master')
    }
  }
  catch {
    errors.branches = 'Impossible de charger les branches.'
  }
  finally {
    isLoading.branches = false
  }
}

const loadPullRequestDetails = async (number: number) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.pullRequestDetails = true
  errors.pullRequestDetails = ''
  try {
    selectedPullRequest.value = await crmApi.getProjectGithubPullRequestByNumber(slug.value, projectId.value, number, selectedRepo.value, pullRequestState.value)
    selectedDetailType.value = 'pull-request'
  }
  catch {
    errors.pullRequestDetails = `Impossible de charger les détails de la PR #${number}.`
  }
  finally {
    isLoading.pullRequestDetails = false
  }
}

const loadIssues = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.issues = true
  errors.issues = ''
  try {
    const response = await crmApi.getProjectGithubIssues(slug.value, projectId.value, {
      repo: selectedRepo.value,
      state: issueState.value,
      page,
      limit: issuesPagination.value.limit,
    })
    issues.value = response.items
    issuesPagination.value = response.pagination ?? issuesPagination.value
  }
  catch {
    errors.issues = 'Impossible de charger la liste des issues.'
  }
  finally {
    isLoading.issues = false
  }
}

const loadIssueDetails = async (number: number) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.issueDetails = true
  errors.issueDetails = ''
  try {
    const response = await crmApi.getProjectGithubIssueByNumber(slug.value, projectId.value, number, selectedRepo.value)
    selectedIssue.value = normalizeGithubIssue(response as Record<string, any>)
    selectedDetailType.value = 'issue'
  }
  catch {
    errors.issueDetails = `Impossible de charger les détails de l'issue #${number}.`
  }
  finally {
    isLoading.issueDetails = false
  }
}

const loadProjects = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.projects = true
  errors.projects = ''
  try {
    const response = await crmApi.getProjectGithubProjects(slug.value, projectId.value, {
      repo: selectedRepo.value,
      page,
      limit: projectsPagination.value.limit,
    })
    projects.value = response.items
    projectsPagination.value = response.pagination ?? projectsPagination.value
    if (!selectedGithubProject.value || !projects.value.some(project => project.id === selectedGithubProject.value?.id)) {
      selectedGithubProject.value = projects.value[0] ?? null
    }
    if (selectedGithubProject.value) {
      await loadProjectItems(selectedGithubProject.value.id, 1)
    }
    else {
      selectedGithubProjectItems.value = []
      projectItemsPagination.value = { page: 1, limit: 20, totalItems: 0, totalPages: 1 }
    }
  }
  catch {
    errors.projects = 'Impossible de charger les projets GitHub.'
  }
  finally {
    isLoading.projects = false
  }
}

const loadProjectItems = async (githubProjectId: string, page = 1) => {
  if (!slug.value || !projectId.value) return
  isLoading.projectItems = true
  errors.projectItems = ''
  try {
    const response = await crmApi.getProjectGithubProjectItems(slug.value, projectId.value, githubProjectId, {
      page,
      limit: projectItemsPagination.value.limit,
    })
    selectedGithubProjectItems.value = response.items
    projectItemsPagination.value = response.pagination ?? projectItemsPagination.value
    selectedDetailType.value = 'project'
  }
  catch {
    errors.projectItems = 'Impossible de charger les items de ce projet.'
  }
  finally {
    isLoading.projectItems = false
  }
}

const selectProject = async (project: CrmGithubProject) => {
  selectedGithubProject.value = project
  await loadProjectItems(project.id, 1)
}

const createIssue = async () => {
  if (!slug.value || !projectId.value || !selectedRepo.value || !issueForm.title.trim()) return
  isCreatingIssue.value = true
  errors.createIssue = ''
  try {
    const response = await crmApi.createProjectGithubIssue(slug.value, projectId.value, {
      repository: selectedRepo.value,
      title: issueForm.title.trim(),
      body: issueForm.body?.trim() ?? '',
    })
    selectedIssue.value = normalizeGithubIssue(response as Record<string, any>)
    selectedDetailType.value = 'issue'
    issueForm.title = ''
    issueForm.body = ''
    await loadIssues(1)
  }
  catch {
    errors.createIssue = 'Impossible de créer l’issue.'
  }
  finally {
    isCreatingIssue.value = false
  }
}

const createGithubProject = async () => {
  if (!slug.value || !projectId.value || !githubProjectForm.owner.trim() || !githubProjectForm.title.trim()) return
  isLoading.createGithubProject = true
  errors.createGithubProject = ''
  try {
    await crmApi.createProjectGithubProject(slug.value, projectId.value, {
      owner: githubProjectForm.owner.trim(),
      title: githubProjectForm.title.trim(),
    })
    githubProjectForm.title = ''
    await loadProjects(1)
  }
  catch {
    errors.createGithubProject = 'Impossible de créer le projet GitHub.'
  }
  finally {
    isLoading.createGithubProject = false
  }
}

const createGithubRepository = async () => {
  if (!slug.value || !projectId.value || !githubRepositoryForm.name.trim()) return
  isLoading.createGithubRepository = true
  errors.createGithubRepository = ''
  try {
    await crmApi.createProjectGithubRepository(slug.value, projectId.value, {
      name: githubRepositoryForm.name.trim(),
      description: githubRepositoryForm.description?.trim() ?? '',
      private: githubRepositoryForm.private,
    })
    githubRepositoryForm.name = ''
    githubRepositoryForm.description = ''
    await loadRepositories()
  }
  catch {
    errors.createGithubRepository = 'Impossible de créer le repository GitHub.'
  }
  finally {
    isLoading.createGithubRepository = false
  }
}

const createBranch = async () => {
  if (!slug.value || !projectId.value || !selectedRepo.value || !branchForm.name.trim()) return
  isLoading.createBranch = true
  errors.createBranch = ''
  try {
    await crmApi.createProjectGithubBranch(slug.value, projectId.value, {
      repository: selectedRepo.value,
      name: branchForm.name.trim(),
      sourceBranch: branchForm.sourceBranch?.trim() || 'master',
    })
    branchForm.name = ''
    await loadBranches(1)
  }
  catch {
    errors.createBranch = 'Impossible de créer cette branche.'
  }
  finally {
    isLoading.createBranch = false
  }
}

const deleteBranch = async (name: string) => {
  if (!slug.value || !projectId.value || !selectedRepo.value || !name) return
  isLoading.deleteBranch = true
  errors.deleteBranch = ''
  try {
    await crmApi.deleteProjectGithubBranch(slug.value, projectId.value, {
      repository: selectedRepo.value,
      name,
    })
    await loadBranches(1)
  }
  catch {
    errors.deleteBranch = 'Impossible de supprimer cette branche.'
  }
  finally {
    isLoading.deleteBranch = false
  }
}

const closeIssue = async () => {
  if (!slug.value || !projectId.value || !selectedRepo.value || !selectedIssue.value) return
  isLoading.issueDetails = true
  errors.issueDetails = ''
  try {
    const response = await crmApi.updateProjectGithubIssue(slug.value, projectId.value, selectedIssue.value.number, {
      repository: selectedRepo.value,
      state: 'closed',
    })
    selectedIssue.value = normalizeGithubIssue(response as Record<string, any>)
    await loadIssues(issuesPagination.value.page)
  }
  catch {
    errors.issueDetails = 'Impossible de fermer cette issue.'
  }
  finally {
    isLoading.issueDetails = false
  }
}

const reopenIssue = async () => {
  if (!slug.value || !projectId.value || !selectedRepo.value || !selectedIssue.value) return
  isLoading.issueDetails = true
  errors.issueDetails = ''
  try {
    const response = await crmApi.updateProjectGithubIssue(slug.value, projectId.value, selectedIssue.value.number, {
      repository: selectedRepo.value,
      state: 'open',
    })
    selectedIssue.value = normalizeGithubIssue(response as Record<string, any>)
    await loadIssues(issuesPagination.value.page)
  }
  catch {
    errors.issueDetails = 'Impossible de réouvrir cette issue.'
  }
  finally {
    isLoading.issueDetails = false
  }
}

watch(selectedRepo, async (repo) => {
  if (!repo) return
  issueForm.repository = repo
  branchForm.repository = repo
  branchForm.sourceBranch = 'master'
  branchForm.name = ''
  githubProjectForm.owner = repo.split('/')[0] ?? ''
  await Promise.all([loadPullRequests(1), loadBranches(1), loadIssues(1), loadProjects(1)])
  selectedPullRequest.value = null
  selectedIssue.value = null
  selectedGithubProject.value = null
  selectedGithubProjectItems.value = []
  await navigateTo({
    path: route.path,
    query: { ...route.query, repo },
  }, { replace: true })
})

watch(pullRequestState, async () => {
  await loadPullRequests(1)
  selectedPullRequest.value = null
})

watch(issueState, async () => {
  await loadIssues(1)
  selectedIssue.value = null
})

onMounted(async () => {
  await Promise.all([loadRepositories(), loadDashboard()])
  if (selectedRepo.value) {
    issueForm.repository = selectedRepo.value
    branchForm.repository = selectedRepo.value
    githubProjectForm.owner = selectedRepo.value.split('/')[0] ?? ''
    await Promise.all([loadPullRequests(1), loadBranches(1), loadIssues(1), loadProjects(1)])
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <v-card-title>Details</v-card-title>
      <v-card-text>
        <v-btn-toggle v-model="selectedDetailType" mandatory density="compact" class="mb-3">
          <v-btn value="pull-request" size="small">PR</v-btn>
          <v-btn value="issue" size="small">Issue</v-btn>
          <v-btn value="project" size="small">Project</v-btn>
        </v-btn-toggle>

        <v-alert v-if="selectedDetailType === 'pull-request' && errors.pullRequestDetails" type="error" variant="tonal" class="mb-3">{{ errors.pullRequestDetails }}</v-alert>
        <v-alert v-if="selectedDetailType === 'issue' && errors.issueDetails" type="error" variant="tonal" class="mb-3">{{ errors.issueDetails }}</v-alert>
        <v-alert v-if="selectedDetailType === 'project' && errors.projectItems" type="error" variant="tonal" class="mb-3">{{ errors.projectItems }}</v-alert>

        <v-skeleton-loader v-if="selectedDetailType === 'pull-request' && isLoading.pullRequestDetails" type="article" />
        <v-skeleton-loader v-else-if="selectedDetailType === 'issue' && isLoading.issueDetails" type="article" />
        <v-skeleton-loader v-else-if="selectedDetailType === 'project' && isLoading.projectItems" type="article" />
        <template v-else-if="selectedDetailType === 'pull-request' && selectedPullRequest">
          <p class="text-subtitle-1 font-weight-bold mb-2">#{{ selectedPullRequest.number }} — {{ selectedPullRequest.title }}</p>
          <p class="mb-1"><strong>Author:</strong> {{ selectedPullRequest.author }}</p>
          <p class="mb-1"><strong>State:</strong> {{ selectedPullRequest.state }}</p>
          <p class="mb-1"><strong>Merged at:</strong> {{ formatDate(selectedPullRequest.mergedAt) }}</p>
          <v-row>
            <v-col cols="12" md="6">
              <p>Commits: {{ selectedPullRequest.commits }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Files: {{ selectedPullRequest.changedFiles }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Additions: +{{ selectedPullRequest.additions }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Deletions: -{{ selectedPullRequest.deletions }}</p>
            </v-col>
          </v-row>
          <p class="mb-1"><strong>Head/Base:</strong> {{ selectedPullRequest.head }} → {{ selectedPullRequest.base }}</p>
          <div class="d-flex ga-2 mt-3 flex-wrap">
            <v-btn color="primary" variant="flat" :href="selectedPullRequest.htmlUrl" target="_blank" prepend-icon="mdi-open-in-new">Open pull request</v-btn>
          </div>
        </template>
        <template v-else-if="selectedDetailType === 'issue' && selectedIssue">
          <p class="text-subtitle-1 font-weight-bold mb-2">#{{ selectedIssue.number }} — {{ selectedIssue.title }}</p>
          <p class="mb-1"><strong>Author:</strong> {{ selectedIssue.author }}</p>
          <p class="mb-1"><strong>State:</strong> {{ selectedIssue.state }}</p>
          <p class="mb-1"><strong>Comments:</strong> {{ selectedIssue.comments }}</p>
          <p class="mb-2"><strong>Updated at:</strong> {{ formatDate(selectedIssue.updatedAt) }}</p>
          <p class="text-body-2 mb-3">{{ selectedIssue.body || 'No description provided.' }}</p>
          <div class="d-flex ga-2 mt-2 flex-wrap">
            <v-btn color="primary" variant="flat" :href="selectedIssue.htmlUrl" target="_blank" prepend-icon="mdi-open-in-new">Open issue</v-btn>
            <v-btn
              v-if="selectedIssue.state === 'open'"
              color="warning"
              variant="outlined"
              prepend-icon="mdi-check"
              :loading="isLoading.issueDetails"
              @click="closeIssue"
            >
              Close issue
            </v-btn>
            <v-btn
              v-else
              color="success"
              variant="outlined"
              prepend-icon="mdi-backup-restore"
              :loading="isLoading.issueDetails"
              @click="reopenIssue"
            >
              Reopen issue
            </v-btn>
          </div>
        </template>
        <template v-else-if="selectedDetailType === 'project' && selectedGithubProject">
          <p class="text-subtitle-1 font-weight-bold mb-2">#{{ selectedGithubProject.number }} — {{ selectedGithubProject.title }}</p>
          <p class="mb-1"><strong>Status:</strong> {{ selectedGithubProject.closed ? 'Closed' : 'Open' }}</p>
          <p class="mb-1"><strong>Updated at:</strong> {{ formatDate(selectedGithubProject.updatedAt) }}</p>
          <div class="d-flex ga-2 mt-2 mb-3 flex-wrap">
            <v-btn color="primary" variant="flat" :href="selectedGithubProject.url" target="_blank" prepend-icon="mdi-open-in-new">Open project</v-btn>
          </div>
          <v-divider class="mb-3" />
          <p class="text-subtitle-2 mb-2">Project items</p>
          <v-list v-if="selectedGithubProjectItems.length" lines="two" density="compact">
            <v-list-item v-for="item in selectedGithubProjectItems" :key="item.id">
              <v-list-item-title>{{ item.issue?.title ?? 'No linked issue' }}</v-list-item-title>
              <v-list-item-subtitle>
                #{{ item.issue?.number ?? 'N/A' }} — {{ item.issue?.state ?? 'UNKNOWN' }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  v-if="item.issue?.url"
                  icon="mdi-open-in-new"
                  size="small"
                  variant="text"
                  :href="item.issue.url"
                  target="_blank"
                />
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">No items in this project.</p>
        </template>
        <p v-else class="text-body-2 text-medium-emphasis mb-0">
          {{
            selectedDetailType === 'pull-request'
              ? 'Select pull request pour voir tous les détails.'
              : selectedDetailType === 'issue'
                ? 'Select issue pour voir tous les détails.'
                : 'Select GitHub project pour voir ses items.'
          }}
        </p>
      </v-card-text>
    </template>
    <section>
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
        <div>
          <h2 class="text-h5 mb-1">GitHub Workspace</h2>
        </div>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="`/platform/${slug}/crm/project/${projectId}`">Back to project</v-btn>
      </div>

      <v-alert v-if="errors.repositories" type="error" variant="tonal" class="mb-4">{{ errors.repositories }}</v-alert>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3"><v-card variant="tonal" color="info"><v-card-text><p class="text-caption mb-1">Open PR</p><p class="text-h6 mb-0">{{ dashboard?.open ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal"><v-card-text><p class="text-caption mb-1">Closed PR</p><p class="text-h6 mb-0">{{ dashboard?.closed ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal" color="success"><v-card-text><p class="text-caption mb-1">Merged PR</p><p class="text-h6 mb-0">{{ dashboard?.merged ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal" color="primary"><v-card-text><p class="text-caption mb-1">Repos linked</p><p class="text-h6 mb-0">{{ repositories.length }}</p></v-card-text></v-card></v-col>
      </v-row>

      <v-row dense class="mb-3">
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedRepo"
            :loading="isLoading.repositories"
            label="Repository"
            :items="repositories.map(item => ({ title: item.fullName, value: item.fullName }))"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="pullRequestState"
            label="State"
            :items="pullRequestStateOptions"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="issueState"
            label="Issue state"
            :items="issueStateOptions"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
          />
        </v-col>
      </v-row>

      <v-tabs v-model="workspaceTab" color="primary" class="mb-3">
        <v-tab value="pull-requests">Pull requests</v-tab>
        <v-tab value="issues">Issues</v-tab>
        <v-tab value="branches">Branches</v-tab>
        <v-tab value="projects">Projects</v-tab>
      </v-tabs>

      <v-row dense>
        <v-col v-if="workspaceTab === 'pull-requests'" cols="12">
          <v-card rounded="xl">
            <v-card-title>Pull requests</v-card-title>
            <v-card-text>
              <v-alert v-if="errors.pullRequests" type="error" variant="tonal" class="mb-3">{{ errors.pullRequests }}</v-alert>
              <v-skeleton-loader v-else-if="isLoading.pullRequests" type="table" />
              <v-table v-else density="comfortable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Head → Base</th>
                    <th>State</th>
                    <th>Merged at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pr in pullRequests" :key="pr.number" class="cursor-pointer" @click="loadPullRequestDetails(pr.number)">
                    <td>#{{ pr.number }}</td>
                    <td class="text-truncate" style="max-width: 320px;">{{ pr.title }}</td>
                    <td>{{ pr.author }}</td>
                    <td>{{ pr.head }} → {{ pr.base }}</td>
                    <td><v-chip :color="pullRequestStatusColor(pr.state, pr.mergedAt)" size="small" variant="tonal">{{ pr.mergedAt ? 'merged' : pr.state }}</v-chip></td>
                    <td>{{ formatDate(pr.mergedAt) }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div v-if="pullRequestsPagination.totalPages > 1" class="d-flex justify-end mt-3">
                <v-pagination
                  :model-value="pullRequestsPagination.page"
                  :length="pullRequestsPagination.totalPages"
                  :total-visible="6"
                  @update:model-value="(page) => loadPullRequests(Number(page))"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="workspaceTab === 'issues'" cols="12">
          <v-card rounded="xl">
            <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
              <span>Issues</span>
            </v-card-title>
            <v-card-text>
              <v-alert v-if="errors.createIssue" type="error" variant="tonal" class="mb-3">{{ errors.createIssue }}</v-alert>
              <v-row dense class="mb-2">
                <v-col cols="12" md="4">
                  <v-text-field v-model="issueForm.repository" label="Repository" density="comfortable" readonly />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="issueForm.title" label="Issue title" density="comfortable" />
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn color="primary" :loading="isCreatingIssue" :disabled="!issueForm.title.trim()" @click="createIssue">Create issue</v-btn>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="issueForm.body" label="Issue description" rows="2" auto-grow density="comfortable" />
                </v-col>
              </v-row>

              <v-alert v-if="errors.issues" type="error" variant="tonal" class="mb-3">{{ errors.issues }}</v-alert>
              <v-skeleton-loader v-else-if="isLoading.issues" type="table" />
              <v-table v-else density="comfortable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Comments</th>
                    <th>State</th>
                    <th>Updated at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="issue in issues" :key="issue.number" class="cursor-pointer" @click="loadIssueDetails(issue.number)">
                    <td>#{{ issue.number }}</td>
                    <td class="text-truncate" style="max-width: 320px;">{{ issue.title }}</td>
                    <td>{{ issue.author }}</td>
                    <td>{{ issue.comments }}</td>
                    <td><v-chip :color="issueStatusColor(issue.state)" size="small" variant="tonal">{{ issue.state }}</v-chip></td>
                    <td>{{ formatDate(issue.updatedAt) }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div v-if="issuesPagination.totalPages > 1" class="d-flex justify-end mt-3">
                <v-pagination
                  :model-value="issuesPagination.page"
                  :length="issuesPagination.totalPages"
                  :total-visible="6"
                  @update:model-value="(page) => loadIssues(Number(page))"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="workspaceTab === 'branches'" cols="12">
          <v-card rounded="xl">
            <v-card-title>Branches</v-card-title>
            <v-card-text>
              <v-alert v-if="errors.branches" type="error" variant="tonal" class="mb-3">{{ errors.branches }}</v-alert>
              <v-alert v-if="errors.createBranch" type="error" variant="tonal" class="mb-3">{{ errors.createBranch }}</v-alert>
              <v-alert v-if="errors.deleteBranch" type="error" variant="tonal" class="mb-3">{{ errors.deleteBranch }}</v-alert>

              <v-row dense class="mb-3">
                <v-col cols="12" md="4">
                  <v-text-field v-model="branchForm.repository" label="Repository" density="comfortable" readonly />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model="branchForm.name" label="New branch name" density="comfortable" placeholder="feature/..." />
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="branchForm.sourceBranch"
                    label="Source branch"
                    :items="branches.map(branch => branch.name)"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="2" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    :loading="isLoading.createBranch"
                    :disabled="!branchForm.name.trim() || !branchForm.sourceBranch"
                    @click="createBranch"
                  >
                    Create branch
                  </v-btn>
                </v-col>
              </v-row>

              <v-skeleton-loader v-if="isLoading.branches" type="list-item, list-item, list-item" />
              <v-list v-else lines="two">
                <v-list-item v-for="branch in branches" :key="branch.sha">
                  <v-list-item-title>{{ branch.name }}</v-list-item-title>
                  <v-list-item-subtitle>SHA: {{ branch.sha }}</v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-chip :color="branch.protected ? 'success' : 'default'" size="small" variant="tonal">
                        {{ branch.protected ? 'Protected' : 'Unprotected' }}
                      </v-chip>
                      <v-btn
                        icon="mdi-delete-outline"
                        size="small"
                        variant="text"
                        color="error"
                        :disabled="branch.protected"
                        :loading="isLoading.deleteBranch"
                        @click="deleteBranch(branch.name)"
                      />
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <div v-if="branchesPagination.totalPages > 1" class="d-flex justify-end mt-3">
                <v-pagination
                  :model-value="branchesPagination.page"
                  :length="branchesPagination.totalPages"
                  :total-visible="6"
                  @update:model-value="(page) => loadBranches(Number(page))"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="workspaceTab === 'projects'" cols="12">
          <v-card rounded="xl">
            <v-card-title>Projects</v-card-title>
            <v-card-text>
              <v-alert v-if="errors.projects" type="error" variant="tonal" class="mb-3">{{ errors.projects }}</v-alert>
              <v-alert v-if="errors.createGithubProject" type="error" variant="tonal" class="mb-3">{{ errors.createGithubProject }}</v-alert>
              <v-alert v-if="errors.createGithubRepository" type="error" variant="tonal" class="mb-3">{{ errors.createGithubRepository }}</v-alert>

              <v-row dense class="mb-3">
                <v-col cols="12" md="4">
                  <v-text-field v-model="githubProjectForm.owner" label="Project owner" density="comfortable" />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field v-model="githubProjectForm.title" label="New project title" density="comfortable" />
                </v-col>
                <v-col cols="12" md="3" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    :loading="isLoading.createGithubProject"
                    :disabled="!githubProjectForm.owner.trim() || !githubProjectForm.title.trim()"
                    @click="createGithubProject"
                  >
                    Create project
                  </v-btn>
                </v-col>
              </v-row>

              <v-row dense class="mb-4">
                <v-col cols="12" md="4">
                  <v-text-field v-model="githubRepositoryForm.name" label="Repository name" density="comfortable" />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field v-model="githubRepositoryForm.description" label="Description" density="comfortable" />
                </v-col>
                <v-col cols="12" md="2" class="d-flex align-center">
                  <v-switch v-model="githubRepositoryForm.private" label="Private" color="primary" hide-details />
                </v-col>
                <v-col cols="12" md="1" class="d-flex align-center justify-end">
                  <v-btn color="secondary" :loading="isLoading.createGithubRepository" :disabled="!githubRepositoryForm.name.trim()" @click="createGithubRepository">
                    Create
                  </v-btn>
                </v-col>
              </v-row>

              <v-skeleton-loader v-if="isLoading.projects" type="table" />
              <v-table v-else density="comfortable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Updated at</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="project in projects"
                    :key="project.id"
                    class="cursor-pointer"
                    @click="selectProject(project)"
                  >
                    <td>#{{ project.number }}</td>
                    <td>{{ project.title }}</td>
                    <td>
                      <v-chip :color="project.closed ? 'default' : 'success'" size="small" variant="tonal">
                        {{ project.closed ? 'Closed' : 'Open' }}
                      </v-chip>
                    </td>
                    <td>{{ formatDate(project.updatedAt) }}</td>
                    <td>
                      <v-btn icon="mdi-open-in-new" size="small" variant="text" :href="project.url" target="_blank" @click.stop />
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <div v-if="projectsPagination.totalPages > 1" class="d-flex justify-end mt-3">
                <v-pagination
                  :model-value="projectsPagination.page"
                  :length="projectsPagination.totalPages"
                  :total-visible="6"
                  @update:model-value="(page) => loadProjects(Number(page))"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
