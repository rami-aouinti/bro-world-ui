<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
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

const loadTaskRequest = async () => {
  if (!slug.value || !requestId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    taskRequest.value = await crmStore.fetchTaskRequestById(slug.value, requestId.value)
  }
  catch {
    errorMessage.value = 'Unable to load task request details.'
  }
  finally {
    isLoading.value = false
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

onMounted(loadTaskRequest)
</script>

<template>
  <PlatformSplitLayout>
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
          <v-btn variant="outlined" :loading="isLoading" @click="loadTaskRequest">Refresh</v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-skeleton-loader v-if="isLoading && !taskRequest" type="article, article" />

      <v-card v-if="taskRequest" rounded="xl">
        <v-card-text>
          <p><strong>Title:</strong> {{ taskRequest.title }}</p>
          <p><strong>Status:</strong> {{ taskRequest.status }}</p>
          <p><strong>Description:</strong> {{ taskRequest.description || 'N/A' }}</p>
          <p><strong>Requested at:</strong> {{ taskRequest.requestedAt || 'N/A' }}</p>
          <p><strong>Resolved at:</strong> {{ taskRequest.resolvedAt || 'N/A' }}</p>

          <v-list v-if="(taskRequest.assignees || []).length" lines="two" class="mt-4">
            <v-list-subheader>Assignees</v-list-subheader>
            <v-list-item v-for="assignee in taskRequest.assignees || []" :key="assignee.id || assignee.email" :title="[assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id" :subtitle="assignee.email || ''" />
          </v-list>

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
