<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskPayload, CrmSprint } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const sprintId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const sprint = ref<CrmSprint | null>(null)
const selectedUserId = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')
const showCreateTaskDialog = ref(false)
const isCreatingTask = ref(false)
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


const getTaskTitle = (task: { title?: string; TITLE?: string }) => task.title || task.TITLE || 'Untitled task'

const openTaskDetail = (id?: string) => {
  if (!id) {
    return
  }

  navigateTo(`/platform/${slug.value}/crm/task/${id}`)
}

const editSprintTask = (id?: string) => openTaskDetail(id)

const deleteSprintTask = async (id?: string) => {
  if (!slug.value || !id) {
    return
  }

  await crmStore.deleteTask(slug.value, id)
  await loadSprint()
}


const loadSprint = async () => {
  if (!slug.value || !sprintId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchEmployees(slug.value)
    sprint.value = await crmStore.fetchSprintById(slug.value, sprintId.value)
    taskForm.projectId = String(sprint.value?.project?.id || sprint.value?.projectId || '') as CreateCrmTaskPayload['projectId']
    taskForm.sprintId = sprintId.value as CreateCrmTaskPayload['sprintId']
  }
  catch {
    errorMessage.value = 'Unable to load sprint details.'
  }
  finally {
    isLoading.value = false
  }
}
const loadEmployee = async () => {
  if (!slug.value || !sprintId.value) {
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
    errorMessage.value = 'Unable to load sprint details.'
  }
  finally {
    isLoading.value = false
  }
}



const assignSprintUser = async () => {
  if (!slug.value || !sprint.value || !selectedUserId.value) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignSprintAssignee(slug.value, sprint.value.id, selectedUserId.value)
    await loadSprint()
    selectedUserId.value = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeSprintUser = async (userId?: string) => {
  if (!slug.value || !sprint.value || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeSprintAssignee(slug.value, sprint.value.id, userId)
    await loadSprint()
  }
  finally {
    isAssigning.value = false
  }
}


const editSprint = () => navigateTo(`/platform/${slug.value}/crm/sprint/${sprintId.value}`)

const deleteSprint = async () => {
  if (!slug.value || !sprint.value) {
    return
  }

  await crmStore.deleteSprint(slug.value, sprint.value.id)
  await navigateTo(`/platform/${slug.value}/crm/sprint`)
}

const createTaskForSprint = async () => {
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
    Object.assign(taskForm, { title: '', description: '', projectId: taskForm.projectId, sprintId: sprintId.value, status: 'todo', priority: 'medium' })
  }
  finally {
    isCreatingTask.value = false
  }
}

onMounted(loadEmployee)
onMounted(loadSprint)
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="text" icon="mdi-refresh" :loading="isLoading" @click="loadSprint"></v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn color="primary" variant="text" @click="showCreateTaskDialog = true" icon="mdi-plus"></v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Sprint detail</h1>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-cog" variant="text" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="editSprint" />
              <v-list-item prepend-icon="mdi-delete" title="Delete" @click="deleteSprint" />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <template v-if="isLoading && !sprint">
        <v-skeleton-loader type="article, article, article" class="mb-4" />
        <v-skeleton-loader type="heading, list-item-three-line, list-item-three-line" />
      </template>

      <v-card v-if="sprint" rounded="xl" class="mb-4">
        <v-card-text class="d-grid ga-2">
          <p><strong>Name:</strong> {{ sprint.name }}</p>
          <p><strong>Goal:</strong> {{ sprint.goal || 'N/A' }}</p>
          <p><strong>Status:</strong> {{ sprint.status }}</p>
          <p><strong>Project name:</strong> {{ sprint.project?.name || 'N/A' }}</p>
          <p><strong>Start date:</strong> {{ sprint.startDate || 'N/A' }}</p>
          <p><strong>End date:</strong> {{ sprint.endDate || 'N/A' }}</p>
        </v-card-text>
      </v-card>


      <v-card v-if="sprint" rounded="xl" class="mb-4">
        <v-card-title>Tasks</v-card-title>
        <v-card-text>
          <v-row v-if="(sprint.tasks || []).length" dense>
            <v-col v-for="item in sprint.tasks || []" :key="item.id" cols="12" md="6">
              <v-card variant="tonal" class="task-card" @click="openTaskDetail(item.id)">
                <v-card-text>
                  <div class="d-flex justify-space-between align-start ga-2">
                    <p class="text-subtitle-2 font-weight-bold mb-1">{{ getTaskTitle(item) }}</p>
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-cog" size="x-small" variant="text" @click.stop />
                      </template>
                      <v-list density="compact">
                        <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editSprintTask(item.id)" />
                        <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="deleteSprintTask(item.id)" />
                      </v-list>
                    </v-menu>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">{{ item.description || 'No description' }}</p>
                  <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
                    <v-chip size="small" variant="tonal">{{ item.status }}</v-chip>
                    <span class="text-caption text-medium-emphasis">{{ item.dueAt || 'N/A' }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <p v-else class="text-body-2 text-medium-emphasis">No tasks available.</p>
        </v-card-text>
      </v-card>

      <v-card v-if="sprint" rounded="xl">
        <v-card-title>Assignees</v-card-title>
        <v-card-text>
          <div class="d-flex ga-2 align-center flex-wrap mb-4">
            <v-select v-model="selectedUserId" label="Ajouter un user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item?.raw?.email">
                  <template #prepend><v-avatar size="28" :image="item?.raw?.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="primary" :loading="isAssigning" @click="assignSprintUser">Assign user</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in sprint.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeSprintUser(assignee.userId || assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!(sprint.assignees || []).length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>
    
      <v-dialog v-model="showCreateTaskDialog" max-width="560">
        <v-card>
          <v-card-title>Adsd task to this sprint</v-card-title>
          <v-card-text>
            <v-text-field v-model="taskForm.title" label="Titre" required />
            <v-textarea v-model="taskForm.description" label="Description" rows="2" />
            <v-text-field v-model="taskForm.status" label="Status" />
            <v-text-field v-model="taskForm.priority" label="Priority" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateTaskDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isCreatingTask" @click="createTaskForSprint">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.assignee-select { min-width: 320px; }

.task-card {
  cursor: pointer;
}
</style>
