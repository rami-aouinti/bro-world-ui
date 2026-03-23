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
const repositories = ref<Array<CrmGithubRepository & { projectName: string }>>([])

const loadData = async () => {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const projectsResponse = await crmApi.getProjects(slug.value)
    const projects = projectsResponse.items ?? []
    const allRepositories: Array<CrmGithubRepository & { projectName: string }> = []

    await Promise.all(
      projects.map(async (project: CrmProject) => {
        try {
          const repositoriesResponse = await crmApi.getProjectGithubRepositories(slug.value, project.id)
          for (const repository of repositoriesResponse.items ?? []) {
            allRepositories.push({ ...repository, projectName: project.name })
          }
        }
        catch {
          // Ignore individual project repository errors to keep partial data available.
        }
      }),
    )

    const deduplicated = new Map<string, CrmGithubRepository & { projectName: string }>()
    for (const item of allRepositories) {
      if (!deduplicated.has(item.fullName)) deduplicated.set(item.fullName, item)
    }

    repositories.value = Array.from(deduplicated.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }
  catch {
    errorMessage.value = 'Impossible de charger les repositories GitHub du workflow CRM.'
  }
  finally {
    isLoading.value = false
  }
}

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
        <v-card-title>Workflow · GitHub Repositories</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!repositories.length" type="info" variant="tonal">
            Aucun repository GitHub lié aux projets CRM.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item v-for="repository in repositories" :key="repository.fullName" :href="`https://github.com/${repository.fullName}`" target="_blank" rel="noopener noreferrer">
              <template #prepend>
                <v-avatar color="grey-darken-4" size="36"><v-icon icon="mdi-github" /></v-avatar>
              </template>
              <v-list-item-title>{{ repository.fullName }}</v-list-item-title>
              <v-list-item-subtitle>
                Branche par défaut: {{ repository.defaultBranch }} · Projet CRM: {{ repository.projectName }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
