<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmProject } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const projectId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const project = ref<CrmProject | null>(null)
const selectedUserId = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')

const users = computed(() => crmStore.getPublicUsers())
const userOptions = computed(() => users.value.map(user => ({ title: `${user.firstName} ${user.lastName}`, value: user.id, photo: user.photo, email: user.email })))

const loadProject = async () => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchPublicUsers()
    project.value = await crmStore.fetchProjectById(slug.value, projectId.value)
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

onMounted(loadProject)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Project detail</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ projectId }}</p>
        </div>
        <v-btn variant="outlined" :loading="isLoading" @click="loadProject">Refresh</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <v-card v-if="project" rounded="xl" class="mb-4">
        <v-card-text class="d-grid ga-2">
          <p><strong>Name:</strong> {{ project.name }}</p>
          <p><strong>Code:</strong> {{ project.code || 'N/A' }}</p>
          <p><strong>Description:</strong> {{ project.description || 'N/A' }}</p>
          <p><strong>Status:</strong> {{ project.status }}</p>
          <p><strong>Company ID:</strong> {{ project.companyId }}</p>
          <p><strong>Started at:</strong> {{ project.startedAt || 'N/A' }}</p>
          <p><strong>Due at:</strong> {{ project.dueAt || 'N/A' }}</p>
        </v-card-text>
      </v-card>

      <v-card v-if="project" rounded="xl">
        <v-card-title>Assignees</v-card-title>
        <v-card-text>
          <div class="d-flex ga-2 align-center flex-wrap mb-4">
            <v-select v-model="selectedUserId" label="Ajouter un user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item.raw.email">
                  <template #prepend><v-avatar size="28" :image="item.raw.photo || undefined" /></template>
                </v-list-item>
              </template>
            </v-select>
            <v-btn color="primary" :loading="isAssigning" @click="assignProjectUser">Assign user</v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="assignee in project.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeProjectUser(assignee.id)">
              <v-avatar start size="20" :image="assignee.photo || undefined" />
              {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
            </v-chip>
            <p v-if="!(project.assignees || []).length" class="text-body-2 text-medium-emphasis">No assignees yet.</p>
          </div>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.assignee-select { min-width: 320px; }
</style>
