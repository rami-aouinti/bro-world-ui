<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmTaskRequest } from '~/types/api/crm'

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
        <v-btn variant="outlined" :loading="isLoading" @click="loadTaskRequest">Refresh</v-btn>
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
    </section>
  </PlatformSplitLayout>
</template>
