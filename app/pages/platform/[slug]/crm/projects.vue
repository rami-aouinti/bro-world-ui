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
const projects = computed(() => crmStore.getProjects(slug.value))
const companiesById = computed(() => new Map(crmStore.getCompanies(slug.value).map(company => [company.id, company.name])))

const loadData = async () => {
  if (!slug.value) {
    return
  }

  await Promise.all([
    crmStore.fetchCompanies(slug.value),
    crmStore.fetchProjects(slug.value),
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
      <h1 class="text-h5 font-weight-bold mb-1">Projects</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Liste des projets CRM depuis l'API.</p>

      <v-row>
        <v-col v-for="project in projects" :key="project.id" cols="12" md="6">
          <v-card rounded="xl" class="h-100">
            <v-card-text>
              <p class="text-subtitle-1 font-weight-bold">{{ project.name }}</p>
              <p class="text-body-2 mb-2">Company: {{ companiesById.get(project.companyId) || project.companyId }}</p>
              <v-chip size="small" variant="tonal">{{ project.status }}</v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
