<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const sprints = computed(() => crmStore.getSprints(slug.value))
const projectsById = computed(() => new Map(crmStore.getProjects(slug.value).map(project => [project.id, project.name])))

const loadData = async () => {
  if (!slug.value) {
    return
  }

  await Promise.all([
    crmStore.fetchProjects(slug.value),
    crmStore.fetchSprints(slug.value),
  ])
}

await loadData()
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <h1 class="text-h5 font-weight-bold mb-1">Sprint Board</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Sprints actifs récupérés depuis l'API CRM.</p>

      <v-row>
        <v-col v-for="sprint in sprints" :key="sprint.id" cols="12" md="6">
          <v-card rounded="xl" class="h-100">
            <v-card-text>
              <p class="text-subtitle-1 font-weight-bold">{{ sprint.name }}</p>
              <p class="text-body-2 mb-1">Project: {{ projectsById.get(sprint.projectId) || sprint.projectId }}</p>
              <p class="text-body-2 mb-2">{{ sprint.startDate }} → {{ sprint.endDate }}</p>
              <v-chip size="small" variant="tonal">{{ sprint.status }}</v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
