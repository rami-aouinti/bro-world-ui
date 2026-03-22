<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskRequestPayload, CrmTask } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const taskId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const task = ref<CrmTask | null>(null)
const selectedUserId = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')
const taskFilesToUpload = ref<File[]>([])
const isUploadingTaskFiles = ref(false)
const uploadErrorMessage = ref('')
const showCreateTaskRequestDialog = ref(false)
const isCreatingTaskRequest = ref(false)
const taskRequestForm = reactive<CreateCrmTaskRequestPayload>({
  title: '',
  taskId: '' as CreateCrmTaskRequestPayload['taskId'],
  status: 'pending',
})

const employees = ref<Any>(null)
const userOptions = ref<Any>(null)

const loadTask = async () => {
  if (!slug.value || !taskId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchEmployees(slug.value)
    task.value = await crmStore.fetchTaskById(slug.value, taskId.value)
    taskRequestForm.taskId = task.value.id
  }
  catch {
    errorMessage.value = 'Unable to load task details.'
  }
  finally {
    isLoading.value = false
  }
}

const assignTaskUser = async () => {
  if (!slug.value || !task.value || !selectedUserId.value) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignTaskAssignee(slug.value, task.value.id, selectedUserId.value)
    await loadTask()
    selectedUserId.value = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeTaskUser = async (userId?: string) => {
  if (!slug.value || !task.value || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeTaskAssignee(slug.value, task.value.id, userId)
    await loadTask()
  }
  finally {
    isAssigning.value = false
  }
}

const uploadTaskFiles = async () => {
  if (!slug.value || !task.value || taskFilesToUpload.value.length === 0) {
    return
  }

  navigateTo(`/platform/${slug.value}/crm/taskRequest/${requestId}`)
}

const createTaskRequestForTask = async () => {
  if (!slug.value || !task.value || !taskRequestForm.title.trim()) {
    return
  }

  isCreatingTaskRequest.value = true
  try {
    await crmStore.createTaskRequest(slug.value, {
      title: taskRequestForm.title.trim(),
      taskId: task.value.id,
      status: taskRequestForm.status,
    })
    showCreateTaskRequestDialog.value = false
    taskRequestForm.title = ''
    taskRequestForm.status = 'pending'
    await loadTask()
  }
  finally {
    isCreatingTaskRequest.value = false
  }
}

const openTaskRequestDetail = (requestId?: string) => {
  if (!requestId) {
    return
  }

  navigateTo(`/platform/${slug.value}/crm/taskRequest/${requestId}`)
}

const editTaskRequest = (requestId?: string) => openTaskRequestDetail(requestId)

const deleteTaskRequest = async (requestId?: string) => {
  if (!slug.value || !requestId) {
    return
  }

  await crmStore.deleteTaskRequest(slug.value, requestId)
  await loadTask()
}

const loadEmployee = async () => {
  if (!slug.value || !taskId.value) {
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

onMounted(loadEmployee)
onMounted(loadTask)
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="outlined" :loading="isLoading" @click="loadTask">Refresh</v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn color="primary" @click="showCreateTaskRequestDialog = true">Create task request</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Task detail</h1>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-alert v-if="uploadErrorMessage" type="error" variant="tonal" class="mb-4">{{ uploadErrorMessage }}</v-alert>

      <template v-if="isLoading && !task">
        <v-skeleton-loader type="article, article, article" class="mb-4" />
        <v-skeleton-loader type="heading, article, article" />
      </template>

      <v-card v-if="task" rounded="xl" class="mb-4">
        <v-card-text>
          <p><strong>Title:</strong> {{ task.title }}</p>
          <p><strong>Status:</strong> {{ task.status }}</p>
          <p><strong>Priority:</strong> {{ task.priority }}</p>
          <p><strong>Project:</strong> {{ task.projectName }}</p>
          <p><strong>Sprint:</strong> {{ task.sprintName }}</p>
          <p><strong>Due at:</strong> {{ task.dueAt || 'N/A' }}</p>

          <div class="d-flex ga-2 align-center flex-wrap mt-4">
            <v-file-input
              v-model="taskFilesToUpload"
              label="Ajouter des fichiers task"
              multiple
              show-size
              chips
              density="comfortable"
              prepend-icon="mdi-paperclip"
              class="assignee-select"
              hide-details
            />
            <v-btn color="primary" :loading="isUploadingTaskFiles" :disabled="!taskFilesToUpload.length" @click="uploadTaskFiles">Upload files</v-btn>
          </div>

          <v-list v-if="(task.attachments || []).length" lines="two" class="mb-4">
            <v-list-item v-for="file in task.attachments || []" :key="`${file.url}-${file.uploadedAt}`" :title="file.originalName" :subtitle="file.mimeType" :href="file.url" target="_blank">
              <template #append>
                <span class="text-caption text-medium-emphasis">{{ file.uploadedAt }}</span>
              </template>
            </v-list-item>
          </v-list>

          <div class="d-flex ga-2 align-center flex-wrap mt-4 mb-3">
            <v-select v-model="selectedUserId" label="Ajouter un user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item?.raw?.email">
                  <template #prepend><v-avatar size="28" :image="item?.raw?.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="primary" :loading="isAssigning" @click="assignTaskUser">Assign to task</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in task.assignees" :key="assignee.id || assignee.email" closable @click:close="removeTaskUser(assignee.userId || assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!task.assignees.length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>

      <v-card v-if="task" rounded="xl">
        <v-card-title>Task requests</v-card-title>
        <v-card-text>
          <v-row v-if="task.children.length" dense>
            <v-col v-for="child in task.children" :key="child.id" cols="12" md="6">
              <v-card variant="tonal" class="task-request-card" @click="openTaskRequestDetail(child.id)">
                <v-card-text>
                  <div class="d-flex justify-space-between align-start ga-2">
                    <p class="text-subtitle-2 font-weight-bold mb-1">{{ child.title }}</p>
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-cog" size="x-small" variant="text" @click.stop />
                      </template>
                      <v-list density="compact">
                        <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editTaskRequest(child.id)" />
                        <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="deleteTaskRequest(child.id)" />
                      </v-list>
                    </v-menu>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">{{ child.description || 'No description' }}</p>
                  <v-chip size="small" variant="tonal">{{ child.status }}</v-chip>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <p v-else class="text-body-2 text-medium-emphasis">No task requests found.</p>
        </v-card-text>
      </v-card>

      <v-card v-if="task?.blog" rounded="xl" class="mt-4">
        <v-card-title>Blog</v-card-title>
        <v-card-text>
          <BlogFeed :blog="task.blog" :show-summary="false" :show-create-post="false" :show-stories="false" :can-interact="false" />
        </v-card-text>
      </v-card>


      <v-dialog v-model="showCreateTaskRequestDialog" max-width="560">
        <v-card>
          <v-card-title>Create task request</v-card-title>
          <v-card-text>
            <v-text-field v-model="taskRequestForm.title" label="Title" required />
            <v-text-field v-model="taskRequestForm.status" label="Status" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateTaskRequestDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isCreatingTaskRequest" @click="createTaskRequestForTask">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.assignee-select {
  min-width: 320px;
}

.task-request-card {
  cursor: pointer;
}
</style>
