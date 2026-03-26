<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskPayload, CrmTask, UpdateCrmTaskPayload } from '~/types/api/crm'
import {useListingPagination} from '~/composables/useListingPagination'
import { useCrmApi } from '~/composables/api/useCrmApi'
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const crmApi = useCrmApi()
const tasks = computed(() => crmStore.getTasks(slug.value))
const isLoading = computed(() => crmStore.isLoading)
const projects = computed(() => crmStore.getProjects(slug.value))
const sprints = computed(() => crmStore.getSprints(slug.value))
const selectedStatusFilter = ref('all')
const selectedRepositoryFilter = ref('all')
const repositoriesByProjectId = ref<Record<string, string[]>>({})
const repositoryOptions = ref<Array<{ title: string, value: string }>>([])
const selectedItem = ref<CrmTask | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    const matchesStatus = selectedStatusFilter.value === 'all'
      || (task.status || 'unknown').toLowerCase() === selectedStatusFilter.value
    const repositories = repositoriesByProjectId.value[task.projectId] ?? []
    const matchesRepository = selectedRepositoryFilter.value === 'all'
      || repositories.includes(selectedRepositoryFilter.value)
    const query = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !query
      || task.title.toLowerCase().includes(query)
      || (task.description || '').toLowerCase().includes(query)
      || (task.projectName || '').toLowerCase().includes(query)
      || (task.sprintName || '').toLowerCase().includes(query)

    return matchesStatus && matchesRepository && matchesSearch
  })
})
const {
  page,
  itemsPerPage,
  paginatedItems: paginatedTasks,
  pageLength,
  shouldShowPagination,
} = useListingPagination(filteredTasks, [selectedStatusFilter, selectedRepositoryFilter, searchQuery])
const statusFilters = computed(() => {
  const counts = new Map<string, number>()

  for (const task of tasks.value) {
    const status = (task.status || 'unknown').toLowerCase()
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const total = tasks.value.length || 1
  const dynamicFilters = Array.from(counts.entries()).map(([value, count]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count,
    ratio: Math.round((count / total) * 100),
  }))

  return [
    {
      value: 'all',
      label: 'All',
      count: tasks.value.length,
      ratio: 100,
    },
    ...dynamicFilters,
  ]
})
const isPageLoading = ref(true)
const errorMessage = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const isMutating = ref(false)
const selectedTask = ref<CrmTask | null>(null)
const createForm = reactive<CreateCrmTaskPayload>({
  title: '',
  description: '',
  projectId: '' as CreateCrmTaskPayload['projectId'],
  sprintId: '' as CreateCrmTaskPayload['sprintId'],
  status: 'todo',
  priority: 'medium',
})
const editForm = reactive<UpdateCrmTaskPayload>({
  title: '',
  description: '',
  status: '',
  priority: '',
})

const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const goToTask = (id: string) => navigateTo(`/platform/${slug.value}/crm/task/${id}`)

const selectTask = (task: CrmTask) => {
  selectedItem.value = task
  showFilters.value = false
}

const showFiltersPanel = () => {
  showFilters.value = true
}

const loadRepositoryFilters = async () => {
  const projectList = projects.value
  const repositoriesMap: Record<string, string[]> = {}
  const allRepositories = new Set<string>()

  await Promise.all(
    projectList.map(async (project) => {
      try {
        const response = await crmApi.getProjectGithubRepositories(slug.value, project.id)
        const repositories = (response.items ?? []).map(item => item.fullName).filter(Boolean)
        repositoriesMap[project.id] = repositories
        repositories.forEach(repository => allRepositories.add(repository))
      }
      catch {
        repositoriesMap[project.id] = []
      }
    }),
  )

  repositoriesByProjectId.value = repositoriesMap
  repositoryOptions.value = Array.from(allRepositories)
    .sort((a, b) => a.localeCompare(b))
    .map(repository => ({ title: repository, value: repository }))
}

const loadData = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await Promise.all([
      crmStore.fetchTasks(slug.value, true),
      crmStore.fetchProjects(slug.value),
      crmStore.fetchSprints(slug.value),
    ])
    await loadRepositoryFilters()
    if (!createForm.projectId && projects.value.length) {
      createForm.projectId = projects.value[0].id
    }
    if (!createForm.sprintId && sprints.value.length) {
      createForm.sprintId = sprints.value[0].id
    }
    if (selectedItem.value) {
      selectedItem.value = tasks.value.find(task => task.id === selectedItem.value?.id) ?? null
    }
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.tasks',
      action: 'load',
      fallbackKey: 'platform.crm.tasks.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.tasks', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
}


const createTask = async () => {
  if (!slug.value || !createForm.title.trim() || !createForm.projectId || !createForm.sprintId) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createTask(slug.value, {
      ...createForm,
      title: createForm.title.trim(),
      description: createForm.description?.trim(),
    })
    showCreateDialog.value = false
    Object.assign(createForm, { title: '', description: '', projectId: createForm.projectId, sprintId: createForm.sprintId, status: 'todo', priority: 'medium' })
  }
  finally {
    isMutating.value = false
  }
}

const openPatchDialog = (task: CrmTask) => {
  selectedTask.value = task
  Object.assign(editForm, {
    title: task.title,
    description: task.description ?? '',
    status: task.status ?? '',
    priority: task.priority ?? '',
  })
  showEditDialog.value = true
}

const patchTask = async () => {
  if (!slug.value || !selectedTask.value) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.updateTask(slug.value, selectedTask.value.id, {
      ...editForm,
      title: editForm.title?.trim(),
      description: editForm.description?.trim(),
    })
    showEditDialog.value = false
    selectedTask.value = null
  }
  finally {
    isMutating.value = false
  }
}

const deleteTask = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteTask(slug.value, id)
}

onMounted(async () => {
  try {
    await loadData()
    await nextTick()
  }
  finally {
    isPageLoading.value = false
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn size="large"
               variant="text"
               class="text-none app-bar__link-btn" :loading="isLoading" @click="loadData" icon="mdi-refresh"></v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined" block @click="showCreateDialog = true">New Task</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav"  />
    </template>
    <template #aside>
      <div class="d-flex flex-column ga-4">
        <template v-if="showFilters">
          <v-card rounded="xl" variant="text">
            <v-card-title class="text-subtitle-2">Filters</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
              <v-text-field
                v-model="searchQuery"
                label="Search"
                density="comfortable"
                variant="outlined"
                rounded="xl"
                hide-details
                prepend-inner-icon="mdi-magnify"
              />
              <v-select
                v-model="selectedRepositoryFilter"
                label="Repository"
                density="comfortable"
                variant="outlined"
                rounded="xl"
                hide-details
                :items="[{ title: 'All repositories', value: 'all' }, ...repositoryOptions]"
              />
              <v-btn
                v-for="filter in statusFilters"
                :key="`task-filter-${filter.value}`"
                :variant="selectedStatusFilter === filter.value ? 'flat' : 'tonal'"
                :color="selectedStatusFilter === filter.value ? 'primary' : undefined"
                class="justify-space-between"
                @click="selectedStatusFilter = filter.value"
              >
                <span>{{ filter.label }} ({{ filter.count }})</span>
                <span class="text-caption">{{ filter.ratio }}%</span>
              </v-btn>
            </v-card-text>
          </v-card>
        </template>
        <v-card v-else-if="selectedItem" rounded="xl" variant="text">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
          <h4 class="text-truncate">{{ selectedItem.title }}</h4>
          <v-card-text class="d-flex flex-column ga-2">
            <p v-if="selectedItem.description" class="text-body-2 mb-0">{{ selectedItem?.description || 'No description' }}</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip size="small" variant="tonal">{{ selectedItem.projectName }}</v-chip>
              <v-chip size="small" variant="tonal">{{ selectedItem.sprintName }}</v-chip>
              <v-chip size="small" color="primary" variant="tonal">{{ selectedItem.status || 'unknown' }}</v-chip>
              <v-chip size="small" color="secondary" variant="tonal">{{ selectedItem.priority || 'N/A' }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>

    <section class="tasks-page">
      <div class="tasks-page__content">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <UiSkeletonCardGrid :cards="4" :columns="6"  v-if="isPageLoading" />

        <v-row v-else>
          <v-col v-for="task in paginatedTasks" :key="task.id" cols="12" md="6" lg="6">
            <v-card rounded="xl" variant="outlined" class="h-100 tasks-card cursor-pointer" @click="selectTask(task)">
              <v-card-text>
                <div class="d-flex justify-space-between align-start mb-2 ga-2">
                  <p class="text-subtitle-1 font-weight-bold mb-0">{{ task.title }}</p>
                </div>
              </v-card-text>
              <v-card-text>
                <div class="d-flex justify-between">
                  <v-btn @click.stop="goToTask(task.id)" variant="outlined" rounded="xl" class="text-body-2">Open</v-btn>
                  <v-spacer />
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn
                          v-bind="props"
                          variant="outlined" rounded="xl" class="text-body-2"
                          @click.stop
                      >Manage</v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="openPatchDialog(task)" />
                      <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="deleteTask(task.id)" />
                    </v-list>
                  </v-menu>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-if="paginatedTasks.length === 0" cols="12">
            <v-alert type="info" variant="tonal">No tasks found for the current filters.</v-alert>
          </v-col>
        </v-row>
      </div>
      <div v-if="shouldShowPagination" class="tasks-page__footer d-flex justify-center">
        <v-pagination v-model="page" :length="pageLength" total-visible="4" />
      </div>
      <v-dialog v-model="showCreateDialog" max-width="560" retain-focus>
        <v-card>
          <v-card-title>Create task</v-card-title>
          <v-card-text>
            <v-text-field rounded="xl" variant="outlined" v-model="createForm.title" label="Titre" required />
            <v-textarea rounded="xl" variant="outlined" v-model="createForm.description" label="Description" rows="2" />
            <v-select rounded="xl" variant="outlined" v-model="createForm.projectId" label="Project" :items="projects" item-title="name" item-value="id" />
            <v-select rounded="xl" variant="outlined" v-model="createForm.sprintId" label="Sprint" :items="sprints" item-title="name" item-value="id" />
            <v-row>
              <v-col cols="6">
                <v-text-field rounded="xl" variant="outlined" v-model="createForm.status" label="Status" />
              </v-col>
              <v-col cols="6">
                <v-text-field rounded="xl" variant="outlined" v-model="createForm.priority" label="Priority" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createTask">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showEditDialog" max-width="560" retain-focus>
        <v-card>
          <v-card-title>Update task</v-card-title>
          <v-card-text>
            <v-text-field rounded="xl" variant="outlined" v-model="editForm.title" label="Titre" />
            <v-textarea rounded="xl" variant="outlined" v-model="editForm.description" label="Description" rows="2" />
            <v-text-field rounded="xl" variant="outlined" v-model="editForm.status" label="Status" />
            <v-text-field rounded="xl" variant="outlined" v-model="editForm.priority" label="Priority" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="patchTask">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
<style scoped>
.tasks-page {
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}

.tasks-page__content {
  flex: 1;
}

.tasks-page__footer {
  margin-top: auto;
  padding-bottom: 0px;
}
.tasks-card:hover {
  box-shadow: 0 10px 24px rgba(var(--v-theme-primary));
  transition: transform 140ms ease, box-shadow 140ms ease;
}
</style>
