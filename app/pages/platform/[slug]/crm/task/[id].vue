<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmTask } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const taskId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const task = ref<CrmTask | null>(null)
const selectedUserId = ref('')
const selectedRequestUsers = ref<Record<string, string>>({})
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')
const taskFilesToUpload = ref<File[]>([])
const requestFilesToUpload = ref<Record<string, File[]>>({})
const isUploadingTaskFiles = ref(false)
const uploadingTaskRequestId = ref<string | null>(null)
const uploadErrorMessage = ref('')

const users = computed(() => crmStore.getPublicUsers())
const userOptions = computed(() => users.value.map(user => ({
  title: `${user.firstName} ${user.lastName}`,
  value: user.id,
  photo: user.photo,
  email: user.email,
})))

const loadTask = async () => {
  if (!slug.value || !taskId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchPublicUsers()
    task.value = await crmStore.fetchTaskById(slug.value, taskId.value)
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

const assignTaskRequestUser = async (requestId: string) => {
  const userId = selectedRequestUsers.value[requestId]

  if (!slug.value || !requestId || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignTaskRequestAssignee(slug.value, requestId, userId)
    await loadTask()
    selectedRequestUsers.value[requestId] = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeTaskRequestUser = async (requestId: string, userId?: string) => {
  if (!slug.value || !requestId || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeTaskRequestAssignee(slug.value, requestId, userId)
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

  isUploadingTaskFiles.value = true
  uploadErrorMessage.value = ''
  try {
    task.value = await crmStore.uploadTaskFiles(slug.value, task.value.id, taskFilesToUpload.value)
    taskFilesToUpload.value = []
  }
  catch {
    uploadErrorMessage.value = 'Unable to upload task files.'
  }
  finally {
    isUploadingTaskFiles.value = false
  }
}

const uploadTaskRequestFiles = async (requestId: string) => {
  const files = requestFilesToUpload.value[requestId] ?? []
  if (!slug.value || !requestId || files.length === 0) {
    return
  }

  uploadingTaskRequestId.value = requestId
  uploadErrorMessage.value = ''
  try {
    await crmStore.uploadTaskRequestFiles(slug.value, requestId, files)
    await loadTask()
    requestFilesToUpload.value[requestId] = []
  }
  catch {
    uploadErrorMessage.value = 'Unable to upload task request files.'
  }
  finally {
    uploadingTaskRequestId.value = null
  }
}

onMounted(loadTask)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Task detail</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ taskId }}</p>
        </div>
        <v-btn variant="outlined" :loading="isLoading" @click="loadTask">Refresh</v-btn>
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
                <v-list-item v-bind="props" :subtitle="item.raw.email">
                  <template #prepend><v-avatar size="28" :image="item.raw.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="primary" :loading="isAssigning" @click="assignTaskUser">Assign to task</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in task.assignees" :key="assignee.id || assignee.email" closable @click:close="removeTaskUser(assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!task.assignees.length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>

      <v-card v-for="child in task?.children || []" :key="child.id" rounded="xl" class="mb-3">
        <v-card-text>
          <p class="text-subtitle-1 font-weight-bold mb-1">{{ child.title }}</p>
          <p class="text-body-2 mb-4">Status: {{ child.status }}</p>

          <div class="d-flex ga-2 align-center flex-wrap mb-3">
            <v-file-input
              v-model="requestFilesToUpload[child.id]"
              label="Ajouter des fichiers request"
              multiple
              show-size
              chips
              density="comfortable"
              prepend-icon="mdi-paperclip"
              class="assignee-select"
              hide-details
            />
            <v-btn
              color="primary"
              :loading="uploadingTaskRequestId === child.id"
              :disabled="!(requestFilesToUpload[child.id] || []).length"
              @click="uploadTaskRequestFiles(child.id)"
            >
              Upload files
            </v-btn>
          </div>

          <v-list v-if="(child.attachments || []).length" lines="two" class="mb-3">
            <v-list-item v-for="file in child.attachments || []" :key="`${file.url}-${file.uploadedAt}`" :title="file.originalName" :subtitle="file.mimeType" :href="file.url" target="_blank" />
          </v-list>

          <div class="d-flex ga-2 align-center flex-wrap mb-3">
            <v-select v-model="selectedRequestUsers[child.id]" label="Ajouter un user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item.raw.email">
                  <template #prepend><v-avatar size="28" :image="item.raw.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="secondary" :loading="isAssigning" @click="assignTaskRequestUser(child.id)">Assign to request</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in child.assignees" :key="assignee.id || assignee.email" closable @click:close="removeTaskRequestUser(child.id, assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!child.assignees.length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.assignee-select {
  min-width: 320px;
}
</style>
