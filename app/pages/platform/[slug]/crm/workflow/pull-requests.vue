<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmGithubPullRequestListItem, CrmGithubPullRequestState, CrmProject } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const isLoading = ref(false)
const errorMessage = ref('')
const projects = ref<CrmProject[]>([])
const selectedProjectId = ref('')
const repoOptions = ref<string[]>([])
const selectedRepo = ref('')
const pullRequestState = ref<CrmGithubPullRequestState>('open')
const pullRequests = ref<CrmGithubPullRequestListItem[]>([])

const projectOptions = computed(() => projects.value.map(project => ({ title: project.name, value: project.id })))

const loadProjects = async () => {
  if (!slug.value) return

  const response = await crmApi.getProjects(slug.value)
  projects.value = response.items ?? []

  if (selectedProjectId.value && !projects.value.some(project => project.id === selectedProjectId.value)) {
    selectedProjectId.value = ''
  }
}

const loadRepositories = async () => {
  if (!slug.value || !selectedProjectId.value) {
    repoOptions.value = []
    selectedRepo.value = ''
    return
  }

  const response = await crmApi.getProjectGithubRepositories(slug.value, selectedProjectId.value)
  repoOptions.value = (response.items ?? []).map(item => item.fullName)

  if (!repoOptions.value.includes(selectedRepo.value)) {
    selectedRepo.value = repoOptions.value[0] ?? ''
  }
}

const loadPullRequests = async () => {
  if (!slug.value || !selectedProjectId.value || !selectedRepo.value) {
    pullRequests.value = []
    return
  }

  const response = await crmApi.getProjectGithubPullRequests(slug.value, selectedProjectId.value, {
    repo: selectedRepo.value,
    state: pullRequestState.value,
    page: 1,
    limit: 30,
  })

  pullRequests.value = response.items ?? []
}

const loadData = async () => {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await loadProjects()
    await loadRepositories()
    await loadPullRequests()
  }
  catch {
    errorMessage.value = 'Impossible de charger les pull requests GitHub du workflow CRM.'
  }
  finally {
    isLoading.value = false
  }
}

watch(selectedProjectId, () => {
  selectedRepo.value = ''
  pullRequests.value = []

  loadRepositories()
    .then(() => loadPullRequests())
    .catch(() => {
      errorMessage.value = 'Impossible de charger les pull requests GitHub du workflow CRM.'
    })
})

watch([selectedRepo, pullRequestState], () => {
  loadPullRequests().catch(() => {
    errorMessage.value = 'Impossible de charger les pull requests GitHub du workflow CRM.'
  })
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
          :loading="isLoading"
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
            v-model="pullRequestState"
            label="State"
            density="comfortable"
            variant="outlined"
            hide-details
            :disabled="!selectedProjectId || !selectedRepo"
            :items="[
              { title: 'Open', value: 'open' },
              { title: 'Closed', value: 'closed' },
            ]"
          />
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="outlined" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Pull Requests</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les pull requests.
          </v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="table" />
          <v-alert v-else-if="!selectedRepo" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-alert v-else-if="!pullRequests.length" type="info" variant="tonal">
            Aucune pull request trouvée pour ce filtre.
          </v-alert>
          <v-table v-else>
            <thead>
              <tr>
                <th>#</th>
                <th>Titre</th>
                <th>État</th>
                <th>Auteur</th>
                <th>Branches</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pullRequest in pullRequests" :key="pullRequest.number">
                <td>{{ pullRequest.number }}</td>
                <td>
                  <a :href="pullRequest.htmlUrl" target="_blank" rel="noopener noreferrer">{{ pullRequest.title }}</a>
                </td>
                <td>
                  <v-chip size="small" :color="pullRequest.state === 'open' ? 'success' : 'default'" variant="tonal">{{ pullRequest.state }}</v-chip>
                </td>
                <td>{{ pullRequest.author }}</td>
                <td>{{ pullRequest.head }} → {{ pullRequest.base }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
