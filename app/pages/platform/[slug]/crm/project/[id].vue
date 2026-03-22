<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskPayload, CrmGithubRepository, CrmProject } from '~/types/api/crm'

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
const githubRepositoriesError = ref('')
const githubRepositories = ref<CrmGithubRepository[]>([])
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
const selectedRepository = computed(() => fakeRepositories.value.find(repo => repo.id === selectedRepositoryId.value) ?? null)
const filteredRepositories = computed(() => {
  const query = repoSearch.value.trim().toLowerCase()
  if (!query) {
    return fakeRepositories.value
  }

  return fakeRepositories.value.filter(repo =>
    repo.name.toLowerCase().includes(query)
    || repo.description.toLowerCase().includes(query),
  )
})
const repositoryOpenPrCount = computed(() => selectedRepository.value?.pullRequests.filter(pr => pr.status === 'open').length ?? 0)
const repositoryMergedPrCount = computed(() => selectedRepository.value?.pullRequests.filter(pr => pr.status === 'merged').length ?? 0)
const repositoryClosedPrCount = computed(() => selectedRepository.value?.pullRequests.filter(pr => pr.status === 'closed').length ?? 0)
const filteredPullRequests = computed(() => {
  const repository = selectedRepository.value
  if (!repository) {
    return []
  }

  if (repoStatusFilter.value === 'all') {
    return repository.pullRequests
  }

  return repository.pullRequests.filter(pr => pr.status === repoStatusFilter.value)
})
const selectedPullRequest = computed(() => filteredPullRequests.value.find(pr => pr.id === selectedPullRequestId.value) ?? filteredPullRequests.value[0] ?? null)

const ciStatusColor = (status: RepoCiStatus) => {
  if (status === 'success') return 'success'
  if (status === 'running') return 'info'
  if (status === 'queued') return 'warning'
  return 'error'
}

const pullRequestStatusColor = (status: RepoPrStatus) => {
  if (status === 'open') return 'info'
  if (status === 'merged') return 'success'
  return 'default'
}

const selectRepository = (repoId: string) => {
  selectedRepositoryId.value = repoId
  selectedPullRequestId.value = ''
}

const mergePullRequest = (prId: string) => {
  const repo = selectedRepository.value
  if (!repo) {
    return
  }

  const pr = repo.pullRequests.find(item => item.id === prId)
  if (!pr || pr.status !== 'open') {
    return
  }

  pr.status = 'merged'
  pr.ciStatus = 'success'
}

const closePullRequest = (prId: string) => {
  const repo = selectedRepository.value
  if (!repo) {
    return
  }

  const pr = repo.pullRequests.find(item => item.id === prId)
  if (!pr || pr.status !== 'open') {
    return
  }

  pr.status = 'closed'
}

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
    githubRepositories.value = response.items
  }
  catch {
    githubRepositoriesError.value = 'Unable to load GitHub repositories.'
  }
  finally {
    isLoadingGithubRepositories.value = false
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
onMounted(loadGithubRepositories)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="text-center">
        <v-btn color="primary" @click="showCreateTaskDialog = true">New Task</v-btn>
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card mt-4">
            <v-card-title>Tasks</v-card-title>
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
              <v-list v-if="(project.attachments || []).length" lines="one">
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
                <v-select density="compact" v-model="selectedUserId" label="Add user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props" :subtitle="item?.raw?.email">
                      <template #prepend><v-avatar size="28" :image="item?.raw?.photo || undefined" /></template>
                    </v-list-item>
                  </template>
                </v-select>
                <v-btn color="primary" :loading="isAssigning" @click="assignProjectUser">Assign user</v-btn>
              </div>

              <TransitionGroup name="chips" tag="div" class="d-flex flex-wrap ga-2">
                <v-chip v-for="assignee in project.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeProjectUser(assignee.userId || assignee.id)">
                  <v-avatar start size="20" :image="assignee.photo || undefined" />
                  {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
                </v-chip>
              </TransitionGroup>
              <p v-if="!(project.assignees || []).length" class="text-body-2 text-medium-emphasis mt-3">No assignees yet.</p>
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
          <v-btn variant="text" size="sm" icon="mdi-refresh" :loading="isLoading" @click="loadProject"></v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <template v-if="isLoading && !project">
        <v-skeleton-loader type="article, article, article" class="mb-4" />
        <v-skeleton-loader type="heading, list-item-three-line, list-item-three-line" />
      </template>

      <div v-if="project" class="project-detail-grid">
        <v-card rounded="xl" class="detail-card">
          <v-card-title class="d-flex align-center justify-space-between ga-2 flex-wrap">
            <span>GitHub repositories</span>
            <v-btn variant="text" size="small" prepend-icon="mdi-open-in-new" @click="openGithubRepository(githubRepositories[0]?.fullName || '')" :disabled="!githubRepositories.length">
              Open GitHub view
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="githubRepositoriesError" type="error" variant="tonal" class="mb-3">{{ githubRepositoriesError }}</v-alert>
            <v-skeleton-loader v-else-if="isLoadingGithubRepositories" type="list-item-three-line, list-item-three-line" />
            <v-list v-else-if="githubRepositories.length" lines="two" border rounded>
              <v-list-item
                v-for="repository in githubRepositories"
                :key="repository.fullName"
                @click="openGithubRepository(repository.fullName)"
              >
                <template #prepend>
                  <v-avatar color="grey-darken-4" size="34"><v-icon icon="mdi-github" /></v-avatar>
                </template>
                <v-list-item-title>{{ repository.fullName }}</v-list-item-title>
                <v-list-item-subtitle>Default branch: {{ repository.defaultBranch }}</v-list-item-subtitle>
                <template #append>
                  <v-btn icon="mdi-chevron-right" variant="text" />
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
            <v-select v-model="taskForm.projectId" label="Projet" :items="projectOptions" item-title="title" item-value="value" />
            <v-select v-model="taskForm.sprintId" label="Sprint" :items="sprintOptions" item-title="title" item-value="value" />
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
