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
const selectedItem = ref<CrmGithubIssueListItem | null>(null)
const showFilters = ref(true)

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
const pageLoading = computed(() => isLoadingProjects.value || isLoading.repositories || isLoading.issues)
const errorMessage = computed(() => projectError.value || errors.repositories || errors.issues)
const createIssueUrl = computed(() => selectedRepo.value ? `https://github.com/${selectedRepo.value}/issues/new` : '')

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

watch(selectedProjectId, async () => {
  selectedItem.value = null
  showFilters.value = true
  await loadRepositories()
  await loadIssues(1)
})

watch([selectedRepo, issueState], async () => {
  selectedItem.value = null
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
        />
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined" prepend-icon="mdi-plus" :disabled="!createIssueUrl" :href="createIssueUrl" target="_blank" rel="noopener noreferrer">New Issue</v-btn>
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
        </v-card-text>
      </v-card>
      <v-card v-else-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFilters = true">Filter</v-btn>
        <v-card-title class="px-0">#{{ selectedItem.number }} · {{ selectedItem.title }}</v-card-title>
        <v-card-text class="px-0 d-flex flex-column ga-2">
          <v-chip size="small" :color="selectedItem.state === 'open' ? 'success' : 'default'" variant="tonal">{{ selectedItem.state }}</v-chip>
          <div class="text-body-2">Author: {{ selectedItem.author }}</div>
          <div class="text-body-2">Updated: {{ new Date(selectedItem.updatedAt).toLocaleString() }}</div>
          <v-btn :href="selectedItem.htmlUrl" target="_blank" rel="noopener noreferrer" variant="outlined" prepend-icon="mdi-open-in-new">Open issue</v-btn>
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="outlined" :disabled="!selectedProjectId">
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
          <v-alert v-else-if="!issues.length" type="info" variant="tonal">
            Aucune issue trouvée pour ce filtre.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="issue in issues" :key="issue.number" @click="selectIssue(issue)">
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
  </PlatformSplitLayout>
</template>
