<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmGithubProject, CrmProject } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const isLoading = ref(false)
const errorMessage = ref('')
const projects = ref<CrmProject[]>([])
const repositoriesByProjectId = ref<Record<string, string[]>>({})
const selectedProjectId = ref('')
const selectedRepo = ref('')
const githubProjects = ref<CrmGithubProject[]>([])

const selectableProjects = computed(() => projects.value.filter(project => (repositoriesByProjectId.value[project.id] ?? []).length > 0))
const repoOptions = computed(() => repositoriesByProjectId.value[selectedProjectId.value] ?? [])

const loadProjectRepositories = async () => {
  const response = await crmApi.getProjects(slug.value)
  projects.value = response.items ?? []

  const entries = await Promise.all(
    projects.value.map(async (project) => {
      try {
        const repositoriesResponse = await crmApi.getProjectGithubRepositories(slug.value, project.id)
        return [project.id, (repositoriesResponse.items ?? []).map(item => item.fullName)] as const
      }
      catch {
        return [project.id, []] as const
      }
    }),
  )

  repositoriesByProjectId.value = Object.fromEntries(entries)

  if (!selectableProjects.value.length) {
    selectedProjectId.value = ''
    selectedRepo.value = ''
    return
  }

  if (!selectedProjectId.value || !selectableProjects.value.some(project => project.id === selectedProjectId.value)) {
    selectedProjectId.value = selectableProjects.value[0]?.id ?? ''
  }

  if (!selectedRepo.value || !repoOptions.value.includes(selectedRepo.value)) {
    selectedRepo.value = repoOptions.value[0] ?? ''
  }
}

const loadGithubProjects = async () => {
  if (!slug.value || !selectedProjectId.value || !selectedRepo.value) {
    githubProjects.value = []
    return
  }

  const response = await crmApi.getProjectGithubProjects(slug.value, selectedProjectId.value, {
    repo: selectedRepo.value,
    page: 1,
    limit: 30,
  })

  githubProjects.value = response.items ?? []
}

const loadData = async () => {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await loadProjectRepositories()
    await loadGithubProjects()
  }
  catch {
    errorMessage.value = 'Impossible de charger les GitHub Projects pour ce workflow.'
  }
  finally {
    isLoading.value = false
  }
}

watch(selectedProjectId, () => {
  const availableRepos = repositoriesByProjectId.value[selectedProjectId.value] ?? []
  if (!availableRepos.includes(selectedRepo.value)) {
    selectedRepo.value = availableRepos[0] ?? ''
  }
})

watch(selectedRepo, () => {
  if (!selectedRepo.value) {
    githubProjects.value = []
    return
  }
  loadGithubProjects().catch(() => {
    errorMessage.value = 'Impossible de charger les GitHub Projects pour ce workflow.'
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

    <section>
      <v-card rounded="xl" variant="outlined">
        <v-card-title class="d-flex flex-wrap ga-3 align-center justify-space-between">
          <span>Workflow · GitHub Projects</span>
          <div class="d-flex ga-3 flex-wrap">
            <v-select
              v-model="selectedProjectId"
              label="CRM Project"
              density="comfortable"
              variant="outlined"
              hide-details
              min-width="220"
              :items="selectableProjects.map(project => ({ title: project.name, value: project.id }))"
            />
            <v-select
              v-model="selectedRepo"
              label="Repository"
              density="comfortable"
              variant="outlined"
              hide-details
              min-width="260"
              :disabled="!selectedProjectId"
              :items="repoOptions"
            />
          </div>
        </v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert
            v-else-if="!selectedProjectId || !selectedRepo"
            type="info"
            variant="tonal"
          >
            Aucun repository GitHub lié à vos projets CRM.
          </v-alert>
          <v-alert
            v-else-if="!githubProjects.length"
            type="info"
            variant="tonal"
          >
            Aucun GitHub Project trouvé pour ce repository.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="item in githubProjects" :key="item.id" :href="item.url" target="_blank" rel="noopener noreferrer">
              <template #prepend>
                <v-avatar color="primary" variant="tonal" size="36">
                  <v-icon icon="mdi-view-kanban-outline" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle>
                #{{ item.number }} · {{ item.closed ? 'Closed' : 'Open' }} · maj {{ new Date(item.updatedAt).toLocaleString() }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
