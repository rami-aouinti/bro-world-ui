<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'
import type { CrmGithubRepository, CrmProject } from '~/types/api/crm'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { useListingPagination } from '~/composables/useListingPagination'

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
const selectedItem = ref<CrmGithubRepository | null>(null)
const showFilters = ref(true)

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

const {
  page,
  pageLength,
  paginatedItems: paginatedRepositories,
  shouldShowPagination,
} = useListingPagination(repositories, [selectedProjectId])

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))
const orderedRepositories = computed(() => paginatedRepositories.value.slice().sort((a, b) => a.fullName.localeCompare(b.fullName)))
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories)
const errorMessage = computed(() => projectError.value || errors.repositories)

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

watch(selectedProjectId, async () => {
  selectedItem.value = null
  showFilters.value = true
  await loadRepositories()
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
      <v-card v-if="showFilters" rounded="xl" variant="outlined">
        <v-card-title class="text-subtitle-1">Workflow filters</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedProjectId"
            label="Project"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :items="projectOptions"
          />
        </v-card-text>
      </v-card>
      <v-card v-else-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFilters = true">Filter</v-btn>
        <v-card-title class="px-0">{{ selectedItem.fullName }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" variant="tonal">Default branch: {{ selectedItem.defaultBranch || 'N/A' }}</v-chip>
          <v-chip size="small" :color="selectedItem.private ? 'warning' : 'success'" variant="tonal">{{ selectedItem.private ? 'Private' : 'Public' }}</v-chip>
          <v-btn :href="`https://github.com/${selectedItem.fullName}`" target="_blank" rel="noopener noreferrer" variant="outlined" prepend-icon="mdi-open-in-new">Open on GitHub</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="outlined" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Repositories</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les repositories.
          </v-alert>
          <v-skeleton-loader v-else-if="pageLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!repositories.length" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="repository in orderedRepositories" :key="repository.fullName" @click="selectRepository(repository)">
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
          <v-pagination v-model="page" :length="pageLength" total-visible="4" />
        </v-card-actions>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
