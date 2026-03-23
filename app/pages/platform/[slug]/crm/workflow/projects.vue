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
const selectedProjectId = ref('')
const repoOptions = ref<string[]>([])
const selectedRepo = ref('')
const githubProjects = ref<CrmGithubProject[]>([])

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
    await loadProjects()
    await loadRepositories()
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
  selectedRepo.value = ''
  githubProjects.value = []

  loadRepositories()
    .then(() => loadGithubProjects())
    .catch(() => {
      errorMessage.value = 'Impossible de charger les GitHub Projects pour ce workflow.'
    })
})

watch(selectedRepo, () => {
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
        </v-card-text>
      </v-card>
    </template>

    <section>
      <v-card rounded="xl" variant="outlined" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Projects</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les GitHub Projects.
          </v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!selectedRepo" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-alert v-else-if="!githubProjects.length" type="info" variant="tonal">
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
