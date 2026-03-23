<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmProject, CrmGithubRepository } from '~/types/api/crm'

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
const repositories = ref<CrmGithubRepository[]>([])

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
    repositories.value = []
    return
  }

  const response = await crmApi.getProjectGithubRepositories(slug.value, selectedProjectId.value)
  repositories.value = (response.items ?? []).slice().sort((a, b) => a.fullName.localeCompare(b.fullName))
}

const loadData = async () => {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await loadProjects()
    await loadRepositories()
  }
  catch {
    errorMessage.value = 'Impossible de charger les repositories GitHub du workflow CRM.'
  }
  finally {
    isLoading.value = false
  }
}

watch(selectedProjectId, () => {
  loadRepositories().catch(() => {
    errorMessage.value = 'Impossible de charger les repositories GitHub du workflow CRM.'
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
    </template>

    <section>
      <v-card rounded="xl" variant="outlined" :disabled="!selectedProjectId">
        <v-card-title>Workflow · GitHub Repositories</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-alert v-else-if="!selectedProjectId" type="info" variant="tonal" class="mb-4">
            Sélectionnez un projet CRM dans le panneau de droite pour afficher les repositories.
          </v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!repositories.length" type="info" variant="tonal">
            Aucun repository GitHub lié à ce projet CRM.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="repository in repositories" :key="repository.fullName" :href="`https://github.com/${repository.fullName}`" target="_blank" rel="noopener noreferrer">
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
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
