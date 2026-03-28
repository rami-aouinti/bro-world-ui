<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'
import type { CrmGithubRepository, CrmProject } from '~/types/api/crm'
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
const search = ref('')
const selectedItem = ref<CrmGithubRepository | null>(null)
const showFilters = ref(true)
const page = ref(1)
const itemsPerPage = 5

const isCreateDialogOpen = ref(false)
const isCreatingRepository = ref(false)
const createRepositoryError = ref('')
const createRepositoryPayload = reactive({ fullName: '' })

const {
  repositories,
  isLoading,
  errors,
  loadRepositories,
} = useCrmGithubWorkflow({
  slug,
  projectId: selectedProjectId,
  repository: selectedRepo,
})

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))
const filteredRepositories = computed(() => {
  const query = search.value.trim().toLowerCase()
  const sorted = repositories.value.slice().sort((a, b) => a.fullName.localeCompare(b.fullName))
  if (!query) return sorted
  return sorted.filter(item =>
    item.fullName.toLowerCase().includes(query)
    || String(item.defaultBranch ?? '').toLowerCase().includes(query),
  )
})
const pageLength = computed(() => Math.max(1, Math.ceil(filteredRepositories.value.length / itemsPerPage)))
const paginatedRepositories = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredRepositories.value.slice(start, start + itemsPerPage)
})
const shouldShowPagination = computed(() => filteredRepositories.value.length > itemsPerPage)
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories)
const errorMessage = computed(() => projectError.value || errors.repositories || createRepositoryError.value)

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
}

const selectRepository = (repository: CrmGithubRepository) => {
  selectedItem.value = repository
  showFilters.value = false
}

const openCreateDialog = () => {
  createRepositoryError.value = ''
  createRepositoryPayload.fullName = ''
  isCreateDialogOpen.value = true
}

const createRepository = async () => {
  if (!slug.value || !selectedProjectId.value || !createRepositoryPayload.fullName.trim()) return

  isCreatingRepository.value = true
  createRepositoryError.value = ''

  try {
    await crmApi.addProjectGithubRepository(slug.value, selectedProjectId.value, {
      fullName: createRepositoryPayload.fullName.trim(),
    })
    isCreateDialogOpen.value = false
    await loadRepositories()
  }
  catch {
    createRepositoryError.value = 'Impossible d\'ajouter le repository GitHub.'
  }
  finally {
    isCreatingRepository.value = false
  }
}

watch(selectedProjectId, async () => {
  selectedItem.value = null
  search.value = ''
  showFilters.value = true
  page.value = 1
  await loadRepositories()
})

watch(search, () => {
  page.value = 1
})

watch(pageLength, (nextLength) => {
  if (page.value > nextLength) {
    page.value = nextLength
  }
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
        <v-btn rounded="xl" variant="text" prepend-icon="mdi-plus" :disabled="!selectedProjectId" @click="openCreateDialog">New Repository</v-btn>
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
      <v-chip variant="outlined" class="mb-4 title-chip" prepend-icon="mdi-filter-outline">
        Filters
      </v-chip>
      <v-card v-if="showFilters" rounded="xl" variant="text">
        <v-card-text class="d-flex flex-column ga-3">
          <v-select
            v-model="selectedProjectId"
            label="Project"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :items="projectOptions"
          />
          <v-text-field v-model="search" label="Search" density="comfortable" variant="outlined" hide-details clearable prepend-inner-icon="mdi-magnify" :disabled="!selectedProjectId" />
        </v-card-text>
      </v-card>
      <v-card v-else-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFilters = true">Filter</v-btn>
        <v-card-title class="px-0">{{ selectedItem.fullName }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" variant="tonal">Default branch: {{ selectedItem.defaultBranch || 'N/A' }}</v-chip>
          <v-chip size="small" :color="selectedItem.private ? 'warning' : 'success'" variant="tonal">{{ selectedItem.private ? 'Private' : 'Public' }}</v-chip>
          <v-btn :href="`https://github.com/${selectedItem.fullName}`" target="_blank" rel="noopener noreferrer" variant="text" prepend-icon="mdi-open-in-new">Open on GitHub</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="text" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Repositories</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les repositories.
          </v-alert>
          <v-skeleton-loader v-else-if="pageLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!filteredRepositories.length" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="repository in paginatedRepositories" :key="repository.fullName" @click="selectRepository(repository)">
              <template #prepend>
                <v-avatar color="grey-darken-4" size="36"><v-icon icon="mdi-github" /></v-avatar>
              </template>
              <v-list-item-title>{{ repository.fullName }}</v-list-item-title>
              <v-list-item-subtitle>
                Branche par défaut: {{ repository.defaultBranch }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions v-if="shouldShowPagination" class="justify-center">
          <v-pagination v-model="page" :length="pageLength" total-visible="5" />
        </v-card-actions>
      </v-card>
    </section>

    <v-dialog v-model="isCreateDialogOpen" max-width="520" retain-focus>
      <v-card rounded="xl" variant="text">
        <v-card-title>Add a repository</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert v-if="createRepositoryError" type="error" variant="tonal">{{ createRepositoryError }}</v-alert>
          <v-text-field v-model="createRepositoryPayload.fullName" label="Repository full name" density="comfortable" variant="outlined" placeholder="john-root/bro-world-api" :disabled="isCreatingRepository" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="isCreatingRepository" @click="isCreateDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :loading="isCreatingRepository" :disabled="!createRepositoryPayload.fullName.trim()" @click="createRepository">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformSplitLayout>
</template>
