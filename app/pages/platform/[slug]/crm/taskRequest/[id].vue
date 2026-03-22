<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmTaskRequest, UpdateCrmTaskRequestPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const requestId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const taskRequest = ref<CrmTaskRequest | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const isMutating = ref(false)
const showEditDialog = ref(false)
const editForm = reactive<UpdateCrmTaskRequestPayload>({
  title: '',
  status: '',
})
const filesToUpload = ref<File[]>([])
const isUploadingFiles = ref(false)
const uploadErrorMessage = ref('')
const selectedUserId = ref('')
const isAssigning = ref(false)
const employees = ref<Any>(null)
const userOptions = ref<Any>(null)

const loadTaskRequest = async () => {
  if (!slug.value || !requestId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchEmployees(slug.value)
    taskRequest.value = await crmStore.fetchTaskRequestById(slug.value, requestId.value)
  }
  catch {
    errorMessage.value = 'Unable to load task request details.'
  }
  finally {
    isLoading.value = false
  }
}

const loadEmployee = async () => {
  if (!slug.value) {
    return
  }

  try {
    employees.value = await crmStore.fetchEmployees(slug.value)
    userOptions.value = employees.value.map(employee => ({
      title: `${employee.firstName} ${employee.lastName}`,
      value: employee.userId,
      photo: employee.photo,
      email: employee.email,
    }))
  }
  catch {
    errorMessage.value = 'Unable to load employees.'
  }
}

const openPatchDialog = () => {
  if (!taskRequest.value) {
    return
  }

  editForm.title = taskRequest.value.title
  editForm.status = taskRequest.value.status
  showEditDialog.value = true
}

const patchTaskRequest = async () => {
  if (!slug.value || !taskRequest.value) {
    return
  }

  isMutating.value = true
  try {
    taskRequest.value = await crmStore.updateTaskRequest(slug.value, taskRequest.value.id, {
      title: editForm.title?.trim(),
      status: editForm.status,
      taskId: taskRequest.value.taskId,
    })
    showEditDialog.value = false
  }
  finally {
    isMutating.value = false
  }
}

const deleteTaskRequest = async () => {
  if (!slug.value || !taskRequest.value) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.deleteTaskRequest(slug.value, taskRequest.value.id)
    await navigateTo(`/platform/${slug.value}/crm/task/${taskRequest.value.taskId}`)
  }
  finally {
    isMutating.value = false
  }
}

const uploadTaskRequestAttachments = async () => {
  if (!slug.value || !taskRequest.value || filesToUpload.value.length === 0) {
    return
  }

  isUploadingFiles.value = true
  uploadErrorMessage.value = ''
  try {
    taskRequest.value = await crmStore.uploadTaskRequestFiles(slug.value, taskRequest.value.id, filesToUpload.value)
    filesToUpload.value = []
  }
  catch {
    uploadErrorMessage.value = 'Unable to upload files.'
  }
  finally {
    isUploadingFiles.value = false
  }
}

const assignTaskRequestUser = async () => {
  if (!slug.value || !taskRequest.value || !selectedUserId.value) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignTaskRequestAssignee(slug.value, taskRequest.value.id, selectedUserId.value)
    await loadTaskRequest()
    selectedUserId.value = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeTaskRequestUser = async (userId?: string) => {
  if (!slug.value || !taskRequest.value || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeTaskRequestAssignee(slug.value, taskRequest.value.id, userId)
    await loadTaskRequest()
  }
  finally {
    isAssigning.value = false
  }
}

onMounted(loadEmployee)
onMounted(loadTaskRequest)
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="outlined" :loading="isLoading" @click="loadTaskRequest">Refresh</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <h1 class="text-h5 font-weight-bold mb-1">Task request detail</h1>
        <div class="d-flex ga-2">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-cog" variant="text" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="openPatchDialog" />
              <v-list-item prepend-icon="mdi-delete" title="Delete" :disabled="isMutating" @click="deleteTaskRequest" />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-alert v-if="uploadErrorMessage" type="error" variant="tonal" class="mb-4">{{ uploadErrorMessage }}</v-alert>
      <v-skeleton-loader v-if="isLoading && !taskRequest" type="article, article" />

      <v-card v-if="taskRequest" rounded="xl" class="mb-4">
        <v-card-text>
          <p><strong>Title:</strong> {{ taskRequest.title }}</p>
          <p><strong>Status:</strong> {{ taskRequest.status }}</p>
          <p><strong>Description:</strong> {{ taskRequest.description || 'N/A' }}</p>
          <p><strong>Requested at:</strong> {{ taskRequest.requestedAt || 'N/A' }}</p>
          <p><strong>Resolved at:</strong> {{ taskRequest.resolvedAt || 'N/A' }}</p>

          <div class="d-flex ga-2 align-center flex-wrap mt-4 mb-3">
            <v-file-input
              v-model="filesToUpload"
              label="Ajouter des fichiers"
              multiple
              show-size
              chips
              density="comfortable"
              prepend-icon="mdi-paperclip"
              class="request-input"
              hide-details
            />
            <v-btn color="primary" :loading="isUploadingFiles" :disabled="!filesToUpload.length" @click="uploadTaskRequestAttachments">Upload files</v-btn>
          </div>

          <v-list v-if="(taskRequest.attachments || []).length" lines="two" class="mt-2">
            <v-list-subheader>Attachments</v-list-subheader>
            <v-list-item
              v-for="file in taskRequest.attachments || []"
              :key="`${file.url}-${file.uploadedAt}`"
              :title="file.originalName"
              :subtitle="file.mimeType"
              :href="file.url"
              target="_blank"
            />
          </v-list>

          <div class="d-flex ga-2 align-center flex-wrap mt-4 mb-3">
            <v-select v-model="selectedUserId" label="Ajouter un employee" :items="userOptions" item-title="title" item-value="value" class="request-input" hide-details>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item?.raw?.email">
                  <template #prepend><v-avatar size="28" :image="item?.raw?.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="primary" :loading="isAssigning" @click="assignTaskRequestUser">Assign employee</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in taskRequest.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeTaskRequestUser(assignee.userId || assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!(taskRequest.assignees || []).length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>

      <v-card v-if="taskRequest?.blog" rounded="xl">
        <v-card-title>Blog</v-card-title>
        <v-card-text>
          <BlogFeed :blog="taskRequest.blog" :show-summary="false" :show-create-post="false" :show-stories="false" :can-interact="false" />
        </v-card-text>
      </v-card>

      <v-dialog v-model="showEditDialog" max-width="560">
        <v-card>
          <v-card-title>Patch task request</v-card-title>
          <v-card-text>
            <v-text-field v-model="editForm.title" label="Title" />
            <v-text-field v-model="editForm.status" label="Status" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="patchTaskRequest">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.request-input {
  min-width: 320px;
}
</style>
