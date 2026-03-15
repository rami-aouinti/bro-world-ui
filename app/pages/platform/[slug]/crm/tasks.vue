<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const tasks = computed(() => crmStore.getTasks(slug.value))
const isLoading = computed(() => crmStore.isLoading)
const isPageLoading = ref(true)
const errorMessage = ref('')

const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const goToTask = (id: string) => navigateTo(`/platform/${slug.value}/crm/task/${id}`)

const loadData = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchTasks(slug.value, true)
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
          <p class="text-body-2 text-medium-emphasis mb-0">All CRM tasks in a simple list.</p>
        </div>
        <v-btn color="primary" variant="outlined" :loading="isLoading" @click="loadData">Refresh tasks</v-btn>
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
            <tr v-for="task in tasks" :key="task.id">
              <td class="font-weight-medium">{{ task.title }}</td>
              <td>{{ task.projectName }}</td>
              <td>{{ task.sprintName }}</td>
              <td><v-chip size="small" variant="tonal">{{ task.status }}</v-chip></td>
              <td>{{ task.priority }}</td>
              <td class="text-right">
                <v-btn size="small" variant="text" @click="goToTask(task.id)">View</v-btn>
              </td>
            </tr>
            <tr v-if="tasks.length === 0">
              <td colspan="6" class="text-center text-medium-emphasis py-6">No tasks found.</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
