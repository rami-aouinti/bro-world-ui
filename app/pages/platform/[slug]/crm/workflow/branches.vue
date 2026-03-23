<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'
import type { CrmGithubBranch, CrmProject } from '~/types/api/crm'
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
const selectedItem = ref<CrmGithubBranch | null>(null)
const showFilters = ref(true)

const isCreateDialogOpen = ref(false)
const isCreatingBranch = ref(false)
const createBranchError = ref('')
const createBranchPayload = reactive({ repository: '', name: '' })

const {
  repositories,
  branches,
  isLoading,
  errors,
  branchesPagination,
  loadRepositories,
  loadBranches,
} = useCrmGithubWorkflow({
  slug,
  projectId: selectedProjectId,
  repository: selectedRepo,
})

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))
const repoOptions = computed(() => repositories.value.map(item => item.fullName))
const filteredBranches = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return branches.value
  return branches.value.filter(branch =>
    branch.name.toLowerCase().includes(query)
    || branch.sha.toLowerCase().includes(query),
  )
})
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories || isLoading.branches)
const errorMessage = computed(() => projectError.value || errors.repositories || errors.branches || createBranchError.value)

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
  await loadBranches(branchesPagination.value.page)
}

const selectBranch = (branch: CrmGithubBranch) => {
  selectedItem.value = branch
  showFilters.value = false
}

const openCreateDialog = () => {
  createBranchError.value = ''
  createBranchPayload.repository = selectedRepo.value
  createBranchPayload.name = ''
  isCreateDialogOpen.value = true
}

const createBranch = async () => {
  if (!slug.value || !selectedProjectId.value || !createBranchPayload.repository || !createBranchPayload.name.trim()) return

  isCreatingBranch.value = true
  createBranchError.value = ''

  try {
    await crmApi.createProjectGithubBranch(slug.value, selectedProjectId.value, {
      repository: createBranchPayload.repository,
      name: createBranchPayload.name.trim(),
    })
    isCreateDialogOpen.value = false
    await loadBranches(1)
  }
  catch {
    createBranchError.value = 'Impossible de créer la branche GitHub.'
  }
  finally {
    isCreatingBranch.value = false
  }
}

watch(selectedProjectId, async () => {
  selectedItem.value = null
  search.value = ''
  showFilters.value = true
  await loadRepositories()
  await loadBranches(1)
})

watch(selectedRepo, async () => {
  selectedItem.value = null
  search.value = ''
  await loadBranches(1)
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
        />
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="text" prepend-icon="mdi-plus" :disabled="!selectedProjectId || !selectedRepo" @click="openCreateDialog">New Branch</v-btn>
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
        <v-card-title class="px-0">{{ selectedItem.name }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" :color="selectedItem.protected ? 'warning' : 'info'" variant="tonal">{{ selectedItem.protected ? 'Protected' : 'Unprotected' }}</v-chip>
          <div class="text-body-2">SHA: {{ selectedItem.sha }}</div>
          <v-btn :href="`https://github.com/${selectedRepo}/tree/${selectedItem.name}`" target="_blank" rel="noopener noreferrer" variant="text" prepend-icon="mdi-open-in-new">Open branch</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="text" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Branches</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les branches.
          </v-alert>
          <v-skeleton-loader v-else-if="pageLoading" type="list-item, list-item, list-item, list-item" />
          <v-alert v-else-if="!selectedRepo" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-alert v-else-if="!filteredBranches.length" type="info" variant="tonal">
            Aucune branche trouvée pour ce filtre.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="branch in filteredBranches" :key="branch.sha" @click="selectBranch(branch)">
              <template #prepend>
                <v-avatar :color="branch.protected ? 'warning' : 'info'" variant="tonal" size="34">
                  <v-icon icon="mdi-source-branch" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ branch.name }}</v-list-item-title>
              <v-list-item-subtitle>
                SHA: {{ branch.sha.slice(0, 10) }} · {{ branch.protected ? 'Protected' : 'Unprotected' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions v-if="branchesPagination.totalPages > 1" class="justify-center">
          <v-pagination :model-value="branchesPagination.page" :length="branchesPagination.totalPages" total-visible="5" @update:model-value="(value) => loadBranches(Number(value))" />
        </v-card-actions>
      </v-card>
    </section>

    <v-dialog v-model="isCreateDialogOpen" max-width="520">
      <v-card rounded="xl" variant="text">
        <v-card-title>Create a branch</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert v-if="createBranchError" type="error" variant="tonal">{{ createBranchError }}</v-alert>
          <v-select v-model="createBranchPayload.repository" label="Repository" density="comfortable" variant="outlined" :items="repoOptions" :disabled="isCreatingBranch" />
          <v-text-field v-model="createBranchPayload.name" label="Branch name" density="comfortable" variant="outlined" placeholder="feature/crm-validation-docs" :disabled="isCreatingBranch" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="isCreatingBranch" @click="isCreateDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :loading="isCreatingBranch" :disabled="!createBranchPayload.repository || !createBranchPayload.name.trim()" @click="createBranch">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformSplitLayout>
</template>
