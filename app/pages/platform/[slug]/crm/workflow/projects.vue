<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmProject } from '~/types/api/crm'
import { useCrmApi } from '~/composables/api/useCrmApi'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const isLoading = ref(false)
const errorMessage = ref('')
const projects = ref<CrmProject[]>([])

const orderedProjects = computed(() => projects.value.slice().sort((a, b) => a.name.localeCompare(b.name)))

const loadData = async () => {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await crmApi.getProjects(slug.value)
    projects.value = response.items ?? []
  }
  catch {
    errorMessage.value = 'Impossible de charger les projets CRM du workflow.'
    projects.value = []
  }
  finally {
    isLoading.value = false
  }
}

const openCreateProject = () => navigateTo(`/platform/${slug.value}/crm/projects`)

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
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined" prepend-icon="mdi-plus" @click="openCreateProject">New Project</v-btn>
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
        <v-card-title>Workflow · CRM Projects</v-card-title>

        <v-card-text>
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          <v-skeleton-loader v-else-if="isLoading" type="list-item-three-line, list-item-three-line, list-item-three-line" />
          <v-alert v-else-if="!orderedProjects.length" type="info" variant="tonal">
            Aucun projet CRM trouvé.
          </v-alert>
          <v-list v-else lines="two" border rounded>
            <v-list-item
              v-for="project in orderedProjects"
              :key="project.id"
              :title="project.name"
              :subtitle="`Statut: ${project.status || 'N/A'}`"
              @click="navigateTo(`/platform/${slug}/crm/project/${project.id}`)"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal" size="36">
                  <v-icon icon="mdi-folder-outline" />
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
