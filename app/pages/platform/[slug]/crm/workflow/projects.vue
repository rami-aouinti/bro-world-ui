<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmGithubProject, CrmProject } from '~/types/api/crm'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'

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
const search = ref('')
const selectedItem = ref<CrmGithubProject | null>(null)
const showFilters = ref(true)

const isCreateDialogOpen = ref(false)
const isCreatingGithubProject = ref(false)
const createProjectError = ref('')
const createProjectPayload = reactive({ owner: '', title: '' })

const {
  repositories,
  githubProjects,
  isLoading,
  errors,
  projectsPagination,
  loadRepositories,
  loadGithubProjects,
} = useCrmGithubWorkflow({
  slug,
  projectId: selectedProjectId,
  repository: selectedRepo,
})

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))
const repoOptions = computed(() => repositories.value.map(item => item.fullName))
const filteredGithubProjects = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return githubProjects.value
  return githubProjects.value.filter(item =>
    item.title.toLowerCase().includes(query)
    || String(item.number).includes(query)
    || item.url.toLowerCase().includes(query),
  )
})
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories || isLoading.projects)
const errorMessage = computed(() => projectError.value || errors.repositories || errors.projects || createProjectError.value)

const loadProjects = async () => {
  if (!slug.value) return

  isLoadingProjects.value = true
  projectError.value = ''

  try {
    const response = await crmApi.getProjects(slug.value)
    projects.value = response.items ?? []

    if (selectedProjectId.value && !projects.value.some(project => project.id === selectedProjectId.value)) {
      selectedProjectId.value = ''
      selectedItem.value = null
      showFilters.value = true
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
  await loadGithubProjects(projectsPagination.value.page)
}

const selectGithubProject = (githubProject: CrmGithubProject) => {
  selectedItem.value = githubProject
  showFilters.value = false
}

const openCreateDialog = () => {
  createProjectError.value = ''
  createProjectPayload.owner = ''
  createProjectPayload.title = ''
  isCreateDialogOpen.value = true
}

const createGithubProject = async () => {
  if (!slug.value || !selectedProjectId.value || !createProjectPayload.owner.trim() || !createProjectPayload.title.trim()) return

  isCreatingGithubProject.value = true
  createProjectError.value = ''

  try {
    await crmApi.createProjectGithubProject(slug.value, selectedProjectId.value, {
      owner: createProjectPayload.owner.trim(),
      title: createProjectPayload.title.trim(),
    })
    isCreateDialogOpen.value = false
    await loadGithubProjects(1)
  }
  catch {
    createProjectError.value = 'Impossible de créer le projet GitHub.'
  }
  finally {
    isCreatingGithubProject.value = false
  }
}

watch(selectedProjectId, async () => {
  selectedItem.value = null
  search.value = ''
  showFilters.value = true
  await loadRepositories()
  await loadGithubProjects(1)
})

watch(selectedRepo, async () => {
  selectedItem.value = null
  search.value = ''
  await loadGithubProjects(1)
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
        <v-btn rounded="xl" variant="text" prepend-icon="mdi-plus" :disabled="!selectedProjectId" @click="openCreateDialog">New Project</v-btn>
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
          <v-text-field v-model="search" label="Search" density="comfortable" variant="outlined" hide-details clearable prepend-inner-icon="mdi-magnify" :disabled="!selectedRepo" />
        </v-card-text>
      </v-card>
      <v-card v-else-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFilters = true">Filter</v-btn>
        <v-card-title class="px-0">#{{ selectedItem.number }} · {{ selectedItem.title }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" :color="selectedItem.closed ? 'default' : 'success'" variant="tonal">{{ selectedItem.closed ? 'Closed' : 'Open' }}</v-chip>
          <div class="text-body-2">Updated: {{ new Date(selectedItem.updatedAt).toLocaleString() }}</div>
          <v-btn :href="selectedItem.url" target="_blank" rel="noopener noreferrer" variant="text" prepend-icon="mdi-open-in-new">Open project</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="text" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Projects</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les projets GitHub.
          </v-alert>
          <v-skeleton-loader v-else-if="pageLoading" type="list-item, list-item, list-item" />
          <v-alert v-else-if="!selectedRepo" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-alert v-else-if="!filteredGithubProjects.length" type="info" variant="tonal">
            Aucun projet GitHub trouvé pour ce filtre.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="githubProject in filteredGithubProjects" :key="githubProject.id" @click="selectGithubProject(githubProject)">
              <v-list-item-title>#{{ githubProject.number }} · {{ githubProject.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ new Date(githubProject.updatedAt).toLocaleString() }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions v-if="projectsPagination.totalPages > 1" class="justify-center">
          <v-pagination :model-value="projectsPagination.page" :length="projectsPagination.totalPages" total-visible="5" @update:model-value="(value) => loadGithubProjects(Number(value))" />
        </v-card-actions>
      </v-card>
    </section>

    <v-dialog v-model="isCreateDialogOpen" max-width="520" retain-focus>
      <v-card rounded="xl" variant="text">
        <v-card-title>Create a GitHub project</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert v-if="createProjectError" type="error" variant="tonal">{{ createProjectError }}</v-alert>
          <v-text-field v-model="createProjectPayload.owner" label="Owner node ID" density="comfortable" variant="outlined" placeholder="O_kgDOBfke3Q" :disabled="isCreatingGithubProject" />
          <v-text-field v-model="createProjectPayload.title" label="Project title" density="comfortable" variant="outlined" placeholder="CRM Project Board" :disabled="isCreatingGithubProject" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="isCreatingGithubProject" @click="isCreateDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :loading="isCreatingGithubProject" :disabled="!createProjectPayload.owner.trim() || !createProjectPayload.title.trim()" @click="createGithubProject">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformSplitLayout>
</template>
