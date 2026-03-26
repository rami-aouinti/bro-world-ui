<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'
import type { CrmGithubIssueListItem, CrmGithubIssueState, CrmProject } from '~/types/api/crm'
import { useCrmApi } from '~/composables/api/useCrmApi'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const isLoadingProjects = ref(false)
const projectError = ref('')
const projects = ref<CrmProject[]>([])
const selectedProjectId = ref('')
const selectedRepo = ref('')
const issueState = ref<CrmGithubIssueState>('open')
const search = ref('')
const selectedItem = ref<CrmGithubIssueListItem | null>(null)
const showFilters = ref(true)

const isCreateDialogOpen = ref(false)
const isCreatingIssue = ref(false)
const createIssueError = ref('')
const createIssuePayload = reactive({ repository: '', title: '' })

const {
  repositories,
  issues,
  isLoading,
  errors,
  issuesPagination,
  loadRepositories,
  loadIssues,
} = useCrmGithubWorkflow({
  slug,
  projectId: selectedProjectId,
  repository: selectedRepo,
  issueState,
})

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))
const repoOptions = computed(() => repositories.value.map(item => item.fullName))
const filteredIssues = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return issues.value
  return issues.value.filter(item =>
    item.title.toLowerCase().includes(query)
    || item.author.toLowerCase().includes(query)
    || String(item.number).includes(query),
  )
})
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories || isLoading.issues)
const errorMessage = computed(() => projectError.value || errors.repositories || errors.issues || createIssueError.value)

const loadProjects = async () => {
  if (!slug.value) return

  isLoadingProjects.value = true
  projectError.value = ''

  try {
    const response = await crmApi.getProjects(slug.value)
    projects.value = response.items ?? []

    if (selectedProjectId.value && !projects.value.some(project => project.id === selectedProjectId.value)) {
      selectedProjectId.value = ''
    }
  }
  catch {
    projectError.value = 'Impossible de charger les projets CRM du workflow.'
    projects.value = []
    selectedProjectId.value = ''
  }
  finally {
    isLoadingProjects.value = false
  }
}

const loadData = async () => {
  await loadProjects()
  await loadRepositories()
  await loadIssues(issuesPagination.value.page)
}

const selectIssue = (issue: CrmGithubIssueListItem) => {
  selectedItem.value = issue
  showFilters.value = false
}

const openCreateDialog = () => {
  createIssueError.value = ''
  createIssuePayload.repository = selectedRepo.value
  createIssuePayload.title = ''
  isCreateDialogOpen.value = true
}

const createIssue = async () => {
  if (!slug.value || !selectedProjectId.value || !createIssuePayload.repository || !createIssuePayload.title.trim()) return

  isCreatingIssue.value = true
  createIssueError.value = ''

  try {
    await crmApi.createProjectGithubIssue(slug.value, selectedProjectId.value, {
      repository: createIssuePayload.repository,
      title: createIssuePayload.title.trim(),
    })
    isCreateDialogOpen.value = false
    await loadIssues(1)
  }
  catch {
    createIssueError.value = 'Impossible de créer l\'issue GitHub.'
  }
  finally {
    isCreatingIssue.value = false
  }
}

watch(selectedProjectId, async () => {
  selectedItem.value = null
  search.value = ''
  showFilters.value = true
  await loadRepositories()
  await loadIssues(1)
})

watch([selectedRepo, issueState], async () => {
  selectedItem.value = null
  search.value = ''
  await loadIssues(1)
})

onMounted(loadData)
</script>


<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn
          size="large"
          variant="text"
          class="text-none app-bar__link-btn"
          icon="mdi-refresh"
          :loading="pageLoading"
          @click="loadData"
          aria-label="Icon action"
         />
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="text" prepend-icon="mdi-plus" :disabled="!selectedProjectId || !selectedRepo" @click="openCreateDialog">New Issue</v-btn>
      </teleport>
    </client-only>

    <template #sidebar>
      <PlatformSidebarNav
        title="platform.crm.sidebar.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="crmNav"
      />
    </template>

    <template #aside>
      <v-card v-if="showFilters" rounded="xl" variant="text">
        <v-card-title class="text-subtitle-1">Workflow filters</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-select v-model="selectedProjectId" label="Project" density="comfortable" variant="outlined" hide-details clearable :items="projectOptions" />
          <v-select v-model="selectedRepo" label="Repository" density="comfortable" variant="outlined" hide-details :disabled="!selectedProjectId || !repoOptions.length" :items="repoOptions" />
          <v-select
            v-model="issueState"
            label="State"
            density="comfortable"
            variant="outlined"
            hide-details
            :disabled="!selectedProjectId || !selectedRepo"
            :items="[
              { title: 'Open', value: 'open' },
              { title: 'Closed', value: 'closed' },
              { title: 'All', value: 'all' },
            ]"
          />
          <v-text-field v-model="search" label="Search" density="comfortable" variant="outlined" hide-details clearable prepend-inner-icon="mdi-magnify" :disabled="!selectedRepo" />
        </v-card-text>
      </v-card>
      <v-card v-else-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFilters = true">Filter</v-btn>
        <v-card-title class="px-0">#{{ selectedItem.number }} · {{ selectedItem.title }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" :color="selectedItem.state === 'open' ? 'success' : 'default'" variant="tonal">{{ selectedItem.state }}</v-chip>
          <div class="text-body-2">Author: {{ selectedItem.author }}</div>
          <div class="text-body-2">Updated: {{ new Date(selectedItem.updatedAt).toLocaleString() }}</div>
          <v-btn :href="selectedItem.htmlUrl" target="_blank" rel="noopener noreferrer" variant="text" prepend-icon="mdi-open-in-new">Open issue</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="text" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Issues</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les issues.
          </v-alert>
          <v-skeleton-loader v-else-if="pageLoading" type="table" />
          <v-alert v-else-if="!selectedRepo" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-alert v-else-if="!filteredIssues.length" type="info" variant="tonal">
            Aucune issue trouvée pour ce filtre.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="issue in filteredIssues" :key="issue.number" @click="selectIssue(issue)">
              <v-list-item-title>#{{ issue.number }} · {{ issue.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ issue.author }} · {{ new Date(issue.updatedAt).toLocaleString() }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions v-if="issuesPagination.totalPages > 1" class="justify-center">
          <v-pagination :model-value="issuesPagination.page" :length="issuesPagination.totalPages" total-visible="5" @update:model-value="(value) => loadIssues(Number(value))" />
        </v-card-actions>
      </v-card>
    </section>

    <v-dialog v-model="isCreateDialogOpen" max-width="520" retain-focus>
      <v-card rounded="xl" variant="text">
        <v-card-title>Create an issue</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert v-if="createIssueError" type="error" variant="tonal">{{ createIssueError }}</v-alert>
          <v-select v-model="createIssuePayload.repository" label="Repository" density="comfortable" variant="outlined" :items="repoOptions" :disabled="isCreatingIssue" />
          <v-text-field v-model="createIssuePayload.title" label="Issue title" density="comfortable" variant="outlined" placeholder="Corriger la synchronisation CRM" :disabled="isCreatingIssue" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="isCreatingIssue" @click="isCreateDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :loading="isCreatingIssue" :disabled="!createIssuePayload.repository || !createIssuePayload.title.trim()" @click="createIssue">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformSplitLayout>
</template>
