<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { useCrmStore } from '~/stores/crm'
import type {
  CreateCrmTaskPayload,
  CrmGithubAccountRepository,
  CrmGithubBranch,
  CrmGithubPullRequestListItem,
  CrmGithubPullRequestState,
  CrmGithubRepository,
  CrmProject,
} from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const projectId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()
const crmApi = useCrmApi()

const project = ref<CrmProject | null>(null)
const selectedUserId = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')
const showCreateTaskDialog = ref(false)
const isCreatingTask = ref(false)
const filesToUpload = ref<File[]>([])
const isUploadingFiles = ref(false)
const uploadErrorMessage = ref('')
const isLoadingGithubRepositories = ref(false)
const isLoadingGithubAccountRepositories = ref(false)
const isAddingGithubRepository = ref(false)
const githubRepositoriesError = ref('')
const githubRepositories = ref<CrmGithubRepository[]>([])
const githubAccountRepositoriesError = ref('')
const githubAccountRepositories = ref<CrmGithubAccountRepository[]>([])
const selectedGithubRepositoryFullName = ref('')
const githubRepositoryActionMessage = ref('')
const selectedProjectGithubRepository = ref('')
const pullRequestState = ref<CrmGithubPullRequestState>('open')
const pullRequestStateOptions = [
  { title: 'Open', value: 'open' },
  { title: 'Closed', value: 'closed' },
  { title: 'Close', value: 'close' },
] satisfies Array<{ title: string; value: CrmGithubPullRequestState }>
const projectRepositoryPullRequests = ref<CrmGithubPullRequestListItem[]>([])
const projectRepositoryBranches = ref<CrmGithubBranch[]>([])
const githubAccountRepositoriesPagination = ref({ page: 1, limit: 15, totalItems: 0, totalPages: 1, hasNextPage: false })
const projectRepositoryPullRequestsPagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false })
const projectRepositoryBranchesPagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false })
const isLoadingProjectRepositoryPullRequests = ref(false)
const isLoadingProjectRepositoryBranches = ref(false)
const projectRepositoryPullRequestsError = ref('')
const projectRepositoryBranchesError = ref('')
const projects = computed(() => crmStore.getProjects(slug.value))
const sprints = computed(() => crmStore.getSprints(slug.value))
const projectOptions = computed(() => projects.value.map(item => ({ title: item.name, value: item.id })))
const sprintOptions = computed(() => sprints.value.filter(item => item.projectId === projectId.value).map(item => ({ title: item.name, value: item.id })))
const taskForm = reactive<CreateCrmTaskPayload>({
  title: '',
  description: '',
  projectId: '' as CreateCrmTaskPayload['projectId'],
  sprintId: '' as CreateCrmTaskPayload['sprintId'],
  status: 'todo',
  priority: 'medium',
})

const employees = ref<Any>(null)
const userOptions = ref<Any>(null)
const projectStatusColor = computed(() => {
  const status = String(project.value?.status ?? '').toLowerCase()
  if (status.includes('done') || status.includes('completed')) {
    return 'success'
  }
  if (status.includes('progress') || status.includes('active')) {
    return 'info'
  }
  if (status.includes('blocked') || status.includes('late')) {
    return 'error'
  }

  return 'warning'
})
const githubAccountRepositoryOptions = computed(() => {
  const linkedRepositories = new Set(githubRepositories.value.map(repository => repository.fullName))
  return githubAccountRepositories.value
      .filter(repository => !linkedRepositories.has(repository.fullName))
      .map(repository => ({
        title: repository.fullName,
        value: repository.fullName,
        subtitle: `${repository.defaultBranch} · ${repository.private ? 'Private' : 'Public'}`,
      }))
})

const formatDate = (date?: string | null) => {
  if (!date) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const formatFileSize = (size: number) => {
  if (size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`
}

const pullRequestStatusColor = (state: CrmGithubPullRequestState, mergedAt: string | null) => {
  if (state === 'open') {
    return 'info'
  }
  if (mergedAt) {
    return 'success'
  }

  return 'default'
}

const getTaskTitle = (task: { title?: string; TITLE?: string }) => task.title || task.TITLE || 'Untitled task'

const openTaskDetail = (id?: string) => {
  if (!id) {
    return
  }

  navigateTo(`/platform/${slug.value}/crm/task/${id}`)
}

const editProjectTask = (id?: string) => openTaskDetail(id)

const deleteProjectTask = async (id?: string) => {
  if (!slug.value || !id) {
    return
  }

  await crmStore.deleteTask(slug.value, id)
  await loadProject()
}

const loadProject = async () => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([
      crmStore.fetchEmployees(slug.value),
      crmStore.fetchProjects(slug.value),
      crmStore.fetchSprints(slug.value),
    ])
    project.value = await crmStore.fetchProjectById(slug.value, projectId.value)
    githubRepositories.value = project.value.githubRepositories ?? []
    if (!selectedProjectGithubRepository.value && githubRepositories.value.length) {
      selectedProjectGithubRepository.value = githubRepositories.value[0]?.fullName ?? ''
    }
    taskForm.projectId = projectId.value
    if (!taskForm.sprintId && sprintOptions.value.length) {
      taskForm.sprintId = String(sprintOptions.value[0]?.value ?? '') as CreateCrmTaskPayload['sprintId']
    }
  }
  catch {
    errorMessage.value = 'Unable to load project details.'
  }
  finally {
    isLoading.value = false
  }
}

const assignProjectUser = async () => {
  if (!slug.value || !project.value || !selectedUserId.value) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignProjectAssignee(slug.value, project.value.id, selectedUserId.value)
    await loadProject()
    selectedUserId.value = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeProjectUser = async (userId?: string) => {
  if (!slug.value || !project.value || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeProjectAssignee(slug.value, project.value.id, userId)
    await loadProject()
  }
  finally {
    isAssigning.value = false
  }
}


const editProject = () => navigateTo(`/platform/${slug.value}/crm/project/${projectId.value}`)

const deleteProject = async () => {
  if (!slug.value || !project.value) {
    return
  }

  await crmStore.deleteProject(slug.value, project.value.id)
  await navigateTo(`/platform/${slug.value}/crm/projects`)
}

const createTaskForProject = async () => {
  if (!slug.value || !taskForm.title.trim() || !taskForm.projectId || !taskForm.sprintId) {
    return
  }

  isCreatingTask.value = true
  try {
    await crmStore.createTask(slug.value, {
      ...taskForm,
      title: taskForm.title.trim(),
      description: taskForm.description?.trim(),
    })
    showCreateTaskDialog.value = false
    Object.assign(taskForm, { title: '', description: '', projectId: projectId.value, sprintId: '', status: 'todo', priority: 'medium' })
    if (sprintOptions.value.length) {
      taskForm.sprintId = String(sprintOptions.value[0]?.value ?? '') as CreateCrmTaskPayload['sprintId']
    }
  }
  finally {
    isCreatingTask.value = false
  }
}


const uploadProjectAttachments = async () => {
  if (!slug.value || !project.value || filesToUpload.value.length === 0) {
    return
  }

  isUploadingFiles.value = true
  uploadErrorMessage.value = ''
  try {
    await crmStore.uploadProjectFiles(slug.value, project.value.id, filesToUpload.value)
    project.value = await crmStore.fetchProjectById(slug.value, project.value.id)
    filesToUpload.value = []
  }
  catch {
    uploadErrorMessage.value = 'Unable to upload files.'
  }
  finally {
    isUploadingFiles.value = false
  }
}

const loadEmployee = async () => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    employees.value = await crmStore.fetchEmployees(slug.value)
    userOptions.value = await employees.value.map(employee => ({
      title: `${employee.firstName} ${employee.lastName}`,
      value: employee.userId,
      photo: employee.photo,
      email: employee.email,
    }))
  }
  catch {
    errorMessage.value = 'Unable to load employees.'
  }
  finally {
    isLoading.value = false
  }
}
onMounted(loadEmployee)

const loadGithubRepositories = async () => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoadingGithubRepositories.value = true
  githubRepositoriesError.value = ''
  try {
    const response = await crmApi.getProjectGithubRepositories(slug.value, projectId.value)
    githubRepositories.value = response?.items ?? []
    if (!githubRepositories.value.some(repository => repository.fullName === selectedProjectGithubRepository.value)) {
      selectedProjectGithubRepository.value = githubRepositories.value[0]?.fullName ?? ''
    }
  }
  catch {
    githubRepositoriesError.value = 'Unable to load GitHub repositories.'
  }
  finally {
    isLoadingGithubRepositories.value = false
  }
}

const loadProjectRepositoryPullRequests = async (repositoryFullName: string, page = 1) => {
  if (!slug.value || !projectId.value || !repositoryFullName) {
    return
  }

  isLoadingProjectRepositoryPullRequests.value = true
  projectRepositoryPullRequestsError.value = ''
  try {
    const response = await crmApi.getProjectGithubPullRequests(slug.value, projectId.value, {
      repo: repositoryFullName,
      state: pullRequestState.value,
      page,
      limit: projectRepositoryPullRequestsPagination.value.limit,
    })
    projectRepositoryPullRequests.value = response.items ?? []
    projectRepositoryPullRequestsPagination.value = {
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? projectRepositoryPullRequestsPagination.value.limit,
      totalItems: response.pagination?.totalItems ?? response.items.length,
      totalPages: response.pagination?.totalPages ?? 1,
      hasNextPage: response.pagination?.hasNextPage ?? false,
    }
  }
  catch {
    projectRepositoryPullRequestsError.value = 'Unable to load pull requests for this repository.'
  }
  finally {
    isLoadingProjectRepositoryPullRequests.value = false
  }
}

const loadProjectRepositoryBranches = async (repositoryFullName: string, page = 1) => {
  if (!slug.value || !projectId.value || !repositoryFullName) {
    return
  }

  isLoadingProjectRepositoryBranches.value = true
  projectRepositoryBranchesError.value = ''
  try {
    const response = await crmApi.getProjectGithubBranches(slug.value, projectId.value, {
      repo: repositoryFullName,
      page,
      limit: projectRepositoryBranchesPagination.value.limit,
    })
    projectRepositoryBranches.value = response.items ?? []
    projectRepositoryBranchesPagination.value = {
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? projectRepositoryBranchesPagination.value.limit,
      totalItems: response.pagination?.totalItems ?? response.items.length,
      totalPages: response.pagination?.totalPages ?? 1,
      hasNextPage: response.pagination?.hasNextPage ?? false,
    }
  }
  catch {
    projectRepositoryBranchesError.value = 'Unable to load branches for this repository.'
  }
  finally {
    isLoadingProjectRepositoryBranches.value = false
  }
}

const loadSelectedRepositoryDetails = async (page = 1) => {
  if (!selectedProjectGithubRepository.value) {
    projectRepositoryPullRequests.value = []
    projectRepositoryBranches.value = []
    return
  }

  await Promise.all([
    loadProjectRepositoryPullRequests(selectedProjectGithubRepository.value, page),
    loadProjectRepositoryBranches(selectedProjectGithubRepository.value, page),
  ])
}

const selectProjectGithubRepository = async (repositoryFullName: string) => {
  selectedProjectGithubRepository.value = repositoryFullName
  await loadSelectedRepositoryDetails()
}

const loadGithubAccountRepositories = async (page = 1) => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoadingGithubAccountRepositories.value = true
  githubAccountRepositoriesError.value = ''
  try {
    const response = await crmApi.getProjectGithubAccountRepositories(slug.value, projectId.value, {
      page,
      limit: githubAccountRepositoriesPagination.value.limit,
    })
    githubAccountRepositories.value = response?.items ?? []
    githubAccountRepositoriesPagination.value = {
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? githubAccountRepositoriesPagination.value.limit,
      totalItems: response.pagination?.totalItems ?? response.items.length,
      totalPages: response.pagination?.totalPages ?? 1,
      hasNextPage: response.pagination?.hasNextPage ?? false,
    }
  }
  catch {
    githubAccountRepositoriesError.value = 'Unable to load GitHub account repositories.'
  }
  finally {
    isLoadingGithubAccountRepositories.value = false
  }
}

const addGithubRepositoryToProject = async () => {
  if (!slug.value || !projectId.value || !selectedGithubRepositoryFullName.value) {
    return
  }

  isAddingGithubRepository.value = true
  githubRepositoriesError.value = ''
  githubRepositoryActionMessage.value = ''
  try {
    const response = await crmApi.addProjectGithubRepository(slug.value, projectId.value, {
      fullName: selectedGithubRepositoryFullName.value,
    })
    githubRepositories.value = response.repositories ?? []
    selectedProjectGithubRepository.value = response.repository?.fullName ?? selectedProjectGithubRepository.value
    githubRepositoryActionMessage.value = `Repository ${response.repository.fullName} linked to this project.`
    selectedGithubRepositoryFullName.value = ''
    await loadSelectedRepositoryDetails()
  }
  catch {
    githubRepositoriesError.value = 'Unable to add this GitHub repository to the project.'
  }
  finally {
    isAddingGithubRepository.value = false
  }
}

const openGithubRepository = (repositoryName: string) => {
  if (!repositoryName) {
    return
  }

  navigateTo({
    path: `/platform/${slug.value}/crm/project/${projectId.value}/github`,
    query: { repo: repositoryName },
  })
}

onMounted(loadProject)
onMounted(async () => {
  await loadGithubRepositories()
  await loadSelectedRepositoryDetails()
})
onMounted(loadGithubAccountRepositories)
watch(pullRequestState, async () => {
  await loadSelectedRepositoryDetails(1)
})
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="text" size="sm" icon="mdi-refresh" :loading="isLoading" @click="loadProject"></v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined"  @click="showCreateTaskDialog = true"> New Task </v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="text-center">
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card mt-4">
            <v-card-text>
              <div class="d-flex ga-2 align-center align-items-center flex-wrap mb-4">
                <v-file-input
                    v-model="filesToUpload"
                    multiple
                    show-size
                    chips
                    density="compact"
                    icon="mdi-paperclip"
                    class="attachment-input"
                    hide-details
                />
                <v-btn color="primary" :loading="isUploadingFiles" :disabled="!filesToUpload.length" @click="uploadProjectAttachments">Upload</v-btn>
              </div>
              <v-alert v-if="uploadErrorMessage" type="error" variant="tonal" class="mb-4">{{ uploadErrorMessage }}</v-alert>
              <v-list v-if="(project?.attachments || []).length" lines="one">
                <v-list-item class="justify-content-start" v-for="file in project.attachments || []" :key="`${file.url}-${file.uploadedAt}`" :title="file.originalName" :subtitle="(`${formatFileSize(file.size)}`)" :href="file.url" target="_blank">
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis">No attachments available.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-title>Members</v-card-title>
            <v-card-text>
              <div class="d-flex ga-2 align-center flex-wrap mb-2">
                <v-select v-if="userOptions" density="compact" v-model="selectedUserId" label="Add user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props" :subtitle="item?.raw?.email">
                      <template #prepend><v-avatar size="28" :image="item?.raw?.photo || undefined" /></template>
                    </v-list-item>
                  </template>
                </v-select>
                <v-btn color="primary" :loading="isAssigning" @click="assignProjectUser">Assign user</v-btn>
              </div>

              <TransitionGroup name="chips" tag="div" class="d-flex flex-wrap ga-2">
                <v-chip v-for="assignee in project?.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeProjectUser(assignee.userId || assignee.id)">
                  <v-avatar start size="20" :image="assignee.photo || undefined" />
                  {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
                </v-chip>
              </TransitionGroup>
              <p v-if="!(project?.assignees || []).length" class="text-body-2 text-medium-emphasis mt-3">No assignees yet.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>
      </div>
    </template>
    <section>
      <div class="d-flex align-center justify-end mb-4 ga-2 flex-wrap">
        <div class="d-flex ga-2 flex-wrap">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-cog" variant="text" size="sm"  />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="editProject" />
              <v-list-item prepend-icon="mdi-delete" title="Delete" @click="deleteProject" />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <template v-if="isLoading && !project">
        <v-skeleton-loader type="article, article, article" class="mb-4" />
        <v-skeleton-loader type="heading, list-item-three-line, list-item-three-line" />
      </template>

      <div v-if="project" class="project-detail-grid">
        <v-card rounded="xl" class="detail-card">
          <v-card-text>
            <v-alert v-if="githubRepositoryActionMessage" type="success" variant="tonal" class="mb-3">{{ githubRepositoryActionMessage }}</v-alert>
            <v-alert v-if="githubRepositoriesError" type="error" variant="tonal" class="mb-3">{{ githubRepositoriesError }}</v-alert>
            <v-alert v-if="githubAccountRepositoriesError" type="error" variant="tonal" class="mb-3">{{ githubAccountRepositoriesError }}</v-alert>

            <v-card variant="outlined" rounded="lg" class="mb-4">
              <v-card-text>
                <p class="text-subtitle-2 mb-2">Add a repository from your GitHub account</p>
                <div class="d-flex ga-2 align-center flex-wrap">
                  <v-autocomplete
                      v-model="selectedGithubRepositoryFullName"
                      class="flex-grow-1"
                      density="comfortable"
                      label="GitHub repositories"
                      placeholder="Select a repository"
                      :items="githubAccountRepositoryOptions"
                      item-title="title"
                      item-value="value"
                      item-props
                      hide-details
                      clearable
                      :loading="isLoadingGithubAccountRepositories"
                      :disabled="isLoadingGithubAccountRepositories || !githubAccountRepositoryOptions.length"
                  />
                  <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      :loading="isAddingGithubRepository"
                      :disabled="!selectedGithubRepositoryFullName"
                      @click="addGithubRepositoryToProject"
                  >
                    Add
                  </v-btn>
                </div>
                <p class="text-caption text-medium-emphasis mt-2 mb-0">
                  {{ githubAccountRepositoryOptions.length
                    ? `${githubAccountRepositoryOptions.length} repositories available to link.`
                    : 'All account repositories are already linked or no repository is available.' }}
                </p>
                <div v-if="githubAccountRepositoriesPagination.totalPages > 1" class="mt-3 d-flex justify-end">
                  <v-pagination
                    :model-value="githubAccountRepositoriesPagination.page"
                    :length="githubAccountRepositoriesPagination.totalPages"
                    :total-visible="5"
                    density="comfortable"
                    @update:model-value="(page) => loadGithubAccountRepositories(Number(page))"
                  />
                </div>
              </v-card-text>
            </v-card>

            <v-skeleton-loader v-if="isLoadingGithubRepositories" type="list-item-three-line, list-item-three-line" />
            <v-list v-else-if="githubRepositories.length" lines="two" border rounded>
              <v-list-item
                  v-for="repository in githubRepositories"
                  :key="repository.fullName"
                  :active="selectedProjectGithubRepository === repository.fullName"
                  @click="selectProjectGithubRepository(repository.fullName)"
              >
                <template #prepend>
                  <v-avatar color="grey-darken-4" size="34"><v-icon icon="mdi-github" /></v-avatar>
                </template>
                <v-list-item-title>{{ repository.fullName }}</v-list-item-title>
                <v-list-item-subtitle>Default branch: {{ repository.defaultBranch }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex ga-1">
                    <v-btn icon="mdi-open-in-new" variant="text" @click.stop="openGithubRepository(repository.fullName)" />
                    <v-btn icon="mdi-chevron-right" variant="text" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">Aucun repository GitHub lié à ce projet.</v-alert>

          </v-card-text>
        </v-card>
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-text>
              <div class="d-flex justify-space-between align-start ga-2 mb-4 flex-wrap">
                <div>
                  <p class="text-caption text-medium-emphasis mb-1">Name</p>
                  <p class="text-h6 font-weight-bold mb-1">{{ project?.name }}</p>
                  <p class="text-body-2 text-medium-emphasis mb-0">Code: {{ project?.code || 'N/A' }}</p>
                </div>
                <v-chip :color="projectStatusColor" variant="tonal">{{ project?.status }}</v-chip>
              </div>

              <p class="text-caption text-medium-emphasis mb-1">Description</p>
              <p class="text-body-2 mb-4">{{ project?.description || 'N/A' }}</p>

              <v-timeline density="compact" side="end" line-inset="8">
                <v-timeline-item dot-color="primary" size="small">
                  <div class="text-caption text-medium-emphasis">Started at</div>
                  <div class="text-body-2">{{ formatDate(project?.startedAt) }}</div>
                </v-timeline-item>
                <v-timeline-item dot-color="warning" size="small">
                  <div class="text-caption text-medium-emphasis">Due at</div>
                  <div class="text-body-2">{{ formatDate(project?.dueAt) }}</div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-expand-transition>
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-title>Wiki pages</v-card-title>
            <v-card-text>
              <v-expansion-panels v-if="(project.wikiPages || []).length" variant="accordion">
                <v-expansion-panel v-for="wiki in project.wikiPages || []" :key="wiki.id">
                  <v-expansion-panel-title>
                    <div>
                      <p class="text-subtitle-2 font-weight-bold mb-1">{{ wiki?.title }}</p>
                      <p class="text-caption text-medium-emphasis mb-0">Created {{ formatDate(wiki?.createdAt) }}</p>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-body-2 wiki-content">{{ wiki?.content }}</p>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <p v-else class="text-body-2 text-medium-emphasis">No wiki pages available.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>
        <v-row v-if="(project.tasks || []).length" dense>
          <v-col v-for="item in project.tasks || []" :key="item.id" cols="12" md="6">
            <v-card variant="outlined" class="task-card" @click="openTaskDetail(item.id)">
              <v-card-text>
                <div class="d-flex justify-space-between align-start ga-2">
                  <p class="text-subtitle-2 font-weight-bold mb-1">{{ getTaskTitle(item) }}</p>
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-cog" size="x-small" variant="text" @click.stop />
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editProjectTask(item.id)" />
                      <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="deleteProjectTask(item.id)" />
                    </v-list>
                  </v-menu>
                </div>
                <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
                  <v-chip size="small" variant="tonal">{{ item.status }}</v-chip>
                  <span class="text-caption text-medium-emphasis">{{ formatDate(item.dueAt) }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <p v-else class="text-body-2 text-medium-emphasis">No tasks available.</p>
      </div>
      <v-dialog v-model="showCreateTaskDialog" max-width="560">
        <v-card>
          <v-card-title>Ajouter un task au projet</v-card-title>
          <v-card-text>
            <v-text-field v-model="taskForm.title" label="Titre" required />
            <v-textarea v-model="taskForm.description" label="Description" rows="2" />
            <v-select v-if="projectOptions" v-model="taskForm.projectId" label="Projet" :items="projectOptions" item-title="title" item-value="value" />
            <v-select v-if="sprintOptions" v-model="taskForm.sprintId" label="Sprint" :items="sprintOptions" item-title="title" item-value="value" />
            <v-text-field v-model="taskForm.status" label="Status" />
            <v-text-field v-model="taskForm.priority" label="Priority" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateTaskDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isCreatingTask" @click="createTaskForProject">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.project-detail-grid {
  display: grid;
  gap: 16px;
}

.detail-card {
  animation: card-enter 0.45s ease;
}

.wiki-content {
  white-space: pre-line;
}

.task-card {
  cursor: pointer;
}

.chips-enter-active,
.chips-leave-active {
  transition: all 0.2s ease;
}

.chips-enter-from,
.chips-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
