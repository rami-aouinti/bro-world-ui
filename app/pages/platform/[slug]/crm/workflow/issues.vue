<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmGithubWorkflow } from '~/composables/crm/useCrmGithubWorkflow'
import type { CrmGithubIssueState, CrmProject } from '~/types/api/crm'
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

watch(selectedProjectId, async () => {
  await loadRepositories()
  await loadIssues(1)
})

watch([selectedRepo, issueState], async () => {
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
      <v-card rounded="xl" variant="outlined">
        <v-card-title class="text-subtitle-1">Workflow filters</v-card-title>
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
          <v-select
            v-model="selectedRepo"
            label="Repository"
            density="comfortable"
            variant="outlined"
            hide-details
            :disabled="!selectedProjectId || !repoOptions.length"
            :items="repoOptions"
          />
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
          <v-table v-else>
            <thead>
              <tr>
                <th>#</th>
                <th>Titre</th>
                <th>État</th>
                <th>Auteur</th>
                <th>Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="issue in issues" :key="issue.number">
                <td>{{ issue.number }}</td>
                <td>
                  <a :href="issue.htmlUrl" target="_blank" rel="noopener noreferrer">{{ issue.title }}</a>
                </td>
                <td>
                  <v-chip size="small" :color="issue.state === 'open' ? 'success' : 'default'" variant="tonal">{{ issue.state }}</v-chip>
                </td>
                <td>{{ issue.author }}</td>
                <td>{{ new Date(issue.updatedAt).toLocaleString() }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
