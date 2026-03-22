<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import type { CrmGithubBranch, CrmGithubPullRequestDetails, CrmGithubPullRequestListItem, CrmGithubPullRequestState, CrmGithubRepository } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const projectId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const repositories = ref<CrmGithubRepository[]>([])
const selectedRepo = ref('')
const pullRequestState = ref<CrmGithubPullRequestState>('open')
const pullRequests = ref<CrmGithubPullRequestListItem[]>([])
const pullRequestsPagination = ref({ page: 1, limit: 30, totalItems: 0, totalPages: 1 })
const branches = ref<CrmGithubBranch[]>([])
const branchesPagination = ref({ page: 1, limit: 30, totalItems: 0, totalPages: 1 })
const selectedPullRequest = ref<CrmGithubPullRequestDetails | null>(null)
const dashboard = ref<{ open: number; closed: number; merged: number } | null>(null)

const isLoading = reactive({
  repositories: false,
  dashboard: false,
  pullRequests: false,
  branches: false,
  pullRequestDetails: false,
})
const errors = reactive({
  repositories: '',
  dashboard: '',
  pullRequests: '',
  branches: '',
  pullRequestDetails: '',
})

const formatDate = (date?: string | null) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

const pullRequestStatusColor = (state: CrmGithubPullRequestState, mergedAt: string | null) => {
  if (state === 'open') return 'info'
  if (mergedAt) return 'success'
  return 'default'
}

const loadRepositories = async () => {
  if (!slug.value || !projectId.value) return
  isLoading.repositories = true
  errors.repositories = ''
  try {
    const response = await crmApi.getProjectGithubRepositories(slug.value, projectId.value)
    repositories.value = response.items
    const queryRepo = String(route.query.repo ?? '')
    selectedRepo.value = repositories.value.some(item => item.fullName === queryRepo) ? queryRepo : (repositories.value[0]?.fullName ?? '')
  }
  catch {
    errors.repositories = 'Impossible de charger les repositories GitHub.'
  }
  finally {
    isLoading.repositories = false
  }
}

const loadDashboard = async () => {
  if (!slug.value || !projectId.value) return
  isLoading.dashboard = true
  errors.dashboard = ''
  try {
    const response = await crmApi.getProjectGithubDashboard(slug.value, projectId.value)
    dashboard.value = response.pullRequests
    if (!repositories.value.length) {
      repositories.value = response.repositories
    }
  }
  catch {
    errors.dashboard = 'Impossible de charger le dashboard GitHub.'
  }
  finally {
    isLoading.dashboard = false
  }
}

const loadPullRequests = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.pullRequests = true
  errors.pullRequests = ''
  try {
    const response = await crmApi.getProjectGithubPullRequests(slug.value, projectId.value, {
      repo: selectedRepo.value,
      state: pullRequestState.value,
      page,
      limit: pullRequestsPagination.value.limit,
    })
    pullRequests.value = response.items
    pullRequestsPagination.value = response.pagination ?? pullRequestsPagination.value
  }
  catch {
    errors.pullRequests = 'Impossible de charger la liste des pull requests.'
  }
  finally {
    isLoading.pullRequests = false
  }
}

const loadBranches = async (page = 1) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.branches = true
  errors.branches = ''
  try {
    const response = await crmApi.getProjectGithubBranches(slug.value, projectId.value, {
      repo: selectedRepo.value,
      page,
      limit: branchesPagination.value.limit,
    })
    branches.value = response.items
    branchesPagination.value = response.pagination ?? branchesPagination.value
  }
  catch {
    errors.branches = 'Impossible de charger les branches.'
  }
  finally {
    isLoading.branches = false
  }
}

const loadPullRequestDetails = async (number: number) => {
  if (!slug.value || !projectId.value || !selectedRepo.value) return
  isLoading.pullRequestDetails = true
  errors.pullRequestDetails = ''
  try {
    selectedPullRequest.value = await crmApi.getProjectGithubPullRequestByNumber(slug.value, projectId.value, number, selectedRepo.value)
  }
  catch {
    errors.pullRequestDetails = `Impossible de charger les détails de la PR #${number}.`
  }
  finally {
    isLoading.pullRequestDetails = false
  }
}

watch(selectedRepo, async (repo) => {
  if (!repo) return
  await Promise.all([loadPullRequests(1), loadBranches(1)])
  selectedPullRequest.value = null
  await navigateTo({
    path: route.path,
    query: { ...route.query, repo },
  }, { replace: true })
})

watch(pullRequestState, async () => {
  await loadPullRequests(1)
  selectedPullRequest.value = null
})

onMounted(async () => {
  await Promise.all([loadRepositories(), loadDashboard()])
  if (selectedRepo.value) {
    await Promise.all([loadPullRequests(1), loadBranches(1)])
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <v-card-title>Détail PR</v-card-title>
      <v-card-text>
        <v-alert v-if="errors.pullRequestDetails" type="error" variant="tonal" class="mb-3">{{ errors.pullRequestDetails }}</v-alert>
        <v-skeleton-loader v-else-if="isLoading.pullRequestDetails" type="article" />
        <template v-else-if="selectedPullRequest">
          <p class="text-subtitle-1 font-weight-bold mb-2">#{{ selectedPullRequest.number }} — {{ selectedPullRequest.title }}</p>
          <p class="mb-1"><strong>Author:</strong> {{ selectedPullRequest.author }}</p>
          <p class="mb-1"><strong>State:</strong> {{ selectedPullRequest.state }}</p>
          <p class="mb-1"><strong>Merged at:</strong> {{ formatDate(selectedPullRequest.mergedAt) }}</p>
          <v-row>
            <v-col cols="12" md="6">
              <p>Commits: {{ selectedPullRequest.commits }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Files: {{ selectedPullRequest.changedFiles }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Additions: +{{ selectedPullRequest.additions }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p>Deletions: -{{ selectedPullRequest.deletions }}</p>
            </v-col>
          </v-row>
          <p class="mb-1"><strong>Head/Base:</strong> {{ selectedPullRequest.head }} → {{ selectedPullRequest.base }}</p>
          <div class="d-flex ga-2 mt-3 flex-wrap">
            <v-btn color="primary" variant="flat" :href="selectedPullRequest.htmlUrl" target="_blank" prepend-icon="mdi-open-in-new">Open pull request</v-btn>
          </div>
        </template>
        <p v-else class="text-body-2 text-medium-emphasis mb-0">Select pull request pour voir tous les détails.</p>
      </v-card-text>
    </template>
    <section>
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
        <div>
          <h2 class="text-h5 mb-1">GitHub Workspace</h2>
        </div>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="`/platform/${slug}/crm/project/${projectId}`">Back to project</v-btn>
      </div>

      <v-alert v-if="errors.repositories" type="error" variant="tonal" class="mb-4">{{ errors.repositories }}</v-alert>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3"><v-card variant="tonal" color="info"><v-card-text><p class="text-caption mb-1">Open PR</p><p class="text-h6 mb-0">{{ dashboard?.open ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal"><v-card-text><p class="text-caption mb-1">Closed PR</p><p class="text-h6 mb-0">{{ dashboard?.closed ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal" color="success"><v-card-text><p class="text-caption mb-1">Merged PR</p><p class="text-h6 mb-0">{{ dashboard?.merged ?? 0 }}</p></v-card-text></v-card></v-col>
        <v-col cols="12" md="3"><v-card variant="tonal" color="primary"><v-card-text><p class="text-caption mb-1">Repos linked</p><p class="text-h6 mb-0">{{ repositories.length }}</p></v-card-text></v-card></v-col>
      </v-row>

      <v-row dense class="mb-3">
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedRepo"
            :loading="isLoading.repositories"
            label="Repository"
            :items="repositories.map(item => ({ title: item.fullName, value: item.fullName }))"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="pullRequestState"
            label="State"
            :items="[{ title: 'Open', value: 'open' }, { title: 'Closed', value: 'closed' }]"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
          />
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12">
          <v-card rounded="xl">
            <v-card-title>Pull requests</v-card-title>
            <v-card-text>
              <v-alert v-if="errors.pullRequests" type="error" variant="tonal" class="mb-3">{{ errors.pullRequests }}</v-alert>
              <v-skeleton-loader v-else-if="isLoading.pullRequests" type="table" />
              <v-table v-else density="comfortable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Head → Base</th>
                    <th>State</th>
                    <th>Merged at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pr in pullRequests" :key="pr.number" class="cursor-pointer" @click="loadPullRequestDetails(pr.number)">
                    <td>#{{ pr.number }}</td>
                    <td class="text-truncate" style="max-width: 320px;">{{ pr.title }}</td>
                    <td>{{ pr.author }}</td>
                    <td>{{ pr.head }} → {{ pr.base }}</td>
                    <td><v-chip :color="pullRequestStatusColor(pr.state, pr.mergedAt)" size="small" variant="tonal">{{ pr.mergedAt ? 'merged' : pr.state }}</v-chip></td>
                    <td>{{ formatDate(pr.mergedAt) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card rounded="xl">
            <v-card-title>Branches</v-card-title>
            <v-card-text>
              <v-alert v-if="errors.branches" type="error" variant="tonal" class="mb-3">{{ errors.branches }}</v-alert>
              <v-skeleton-loader v-else-if="isLoading.branches" type="list-item, list-item, list-item" />
              <v-list v-else lines="two">
                <v-list-item v-for="branch in branches" :key="branch.sha">
                  <v-list-item-title>{{ branch.name }}</v-list-item-title>
                  <v-list-item-subtitle>SHA: {{ branch.sha }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="branch.protected ? 'success' : 'default'" size="small" variant="tonal">
                      {{ branch.protected ? 'Protected' : 'Unprotected' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
