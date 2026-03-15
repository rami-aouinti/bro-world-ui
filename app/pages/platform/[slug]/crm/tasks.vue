<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskPayload, CrmTask, UpdateCrmTaskPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const tasks = computed(() => crmStore.getTasks(slug.value))
const isLoading = computed(() => crmStore.isLoading)
const projects = computed(() => crmStore.getProjects(slug.value))
const sprints = computed(() => crmStore.getSprints(slug.value))
const paginatedTasks = computed(() => tasks.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage))
const isPageLoading = ref(true)
const errorMessage = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const isMutating = ref(false)
const page = ref(1)
const itemsPerPage = 5
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
    if (!createForm.projectId && projects.value.length) {
      createForm.projectId = projects.value[0].id
    }
    if (!createForm.sprintId && sprints.value.length) {
      createForm.sprintId = sprints.value[0].id
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
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Tasks list</h1>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="primary" @click="showCreateDialog = true" icon="mdi-plus"></v-btn>
          <v-btn color="primary" variant="outlined" :loading="isLoading" @click="loadData" icon="mdi-refresh"></v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-skeleton-loader v-if="isPageLoading" type="table-heading, table-row-divider@6" />

      <v-card v-else rounded="xl">
        <v-table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Sprint</th>
              <th>Status</th>
              <th>Priority</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in paginatedTasks" :key="task.id">
              <td class="font-weight-medium">{{ task.title }}</td>
              <td>{{ task.projectName }}</td>
              <td>{{ task.sprintName }}</td>
              <td><v-chip size="small" variant="tonal">{{ task.status }}</v-chip></td>
              <td>{{ task.priority }}</td>
              <td class="text-right">
                <div class="d-flex justify-end ga-1">
                  <v-btn icon="mdi-eye" size="small" variant="text" @click="goToTask(task.id)" />
                  <v-btn icon="mdi-pencil" size="small" variant="text" @click="openPatchDialog(task)" />
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteTask(task.id)" />
                </div>
              </td>
            </tr>
            <tr v-if="tasks.length === 0">
              <td colspan="6" class="text-center text-medium-emphasis py-6">No tasks found.</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <div v-if="tasks.length > itemsPerPage" class="d-flex justify-center mt-4">
        <v-pagination v-model="page" :length="Math.ceil(tasks.length / itemsPerPage)" total-visible="5" />
      </div>

      <v-dialog v-model="showCreateDialog" max-width="560">
        <v-card>
          <v-card-title>Créer un task</v-card-title>
          <v-card-text>
            <v-text-field v-model="createForm.title" label="Titre" required />
            <v-textarea v-model="createForm.description" label="Description" rows="2" />
            <v-select v-model="createForm.projectId" label="Projet" :items="projects" item-title="name" item-value="id" />
            <v-select v-model="createForm.sprintId" label="Sprint" :items="sprints" item-title="name" item-value="id" />
            <v-text-field v-model="createForm.status" label="Status" />
            <v-text-field v-model="createForm.priority" label="Priority" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createTask">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showEditDialog" max-width="560">
        <v-card>
          <v-card-title>Patch task</v-card-title>
          <v-card-text>
            <v-text-field v-model="editForm.title" label="Titre" />
            <v-textarea v-model="editForm.description" label="Description" rows="2" />
            <v-text-field v-model="editForm.status" label="Status" />
            <v-text-field v-model="editForm.priority" label="Priority" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showEditDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="patchTask">Enregistrer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
