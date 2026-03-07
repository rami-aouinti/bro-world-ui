<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { crmCompanies, crmProjects } from '~/data/platform-demo'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const accessDenied = ref(false)
const titleMap: Record<string, string> = {
  companies: 'Companies',
  projects: 'Projects',
  sprint: 'Sprint Board',
  calendar: 'Calendar',
  settings: 'Settings',
  billing: 'Billing',
  admin: 'Admin CRM',
}

const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

onMounted(async () => {
  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      navigateTo(platformPermissions.getDeniedRedirectPath('crm'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-6">
        Accès refusé à l’espace admin CRM. Redirection en cours…
      </v-alert>

      <template v-else>
        <h1 class="text-h5 font-weight-bold mb-1">{{ titleMap[page] }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">Vue enrichie avec cards, animation légère et fake data.</p>

        <v-row v-if="page === 'companies'">
          <v-col v-for="company in crmCompanies" :key="company.id" cols="12" md="6" lg="4">
            <v-card rounded="xl" hover class="h-100">
              <v-card-text>
                <p class="text-subtitle-1 font-weight-bold">{{ company.name }}</p>
                <p class="text-body-2 text-medium-emphasis mb-2">{{ company.sector }}</p>
                <v-chip size="small" variant="tonal">{{ company.size }}</v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-else-if="page === 'projects' || page === 'sprint'">
          <v-col v-for="project in crmProjects" :key="project.id" cols="12" md="6">
            <v-card rounded="xl" class="h-100">
              <v-card-text>
                <p class="text-subtitle-1 font-weight-bold">{{ project.title }}</p>
                <p class="text-body-2 mb-2">Owner: {{ project.owner }}</p>
                <v-progress-linear :model-value="project.progress" color="primary" rounded="pill" height="8" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="i in 6" :key="i" cols="12" md="6" lg="4">
            <v-card rounded="xl" variant="outlined" class="h-100">
              <v-card-text>
                <p class="text-subtitle-2 font-weight-bold">{{ titleMap[page] }} card #{{ i }}</p>
                <p class="text-body-2 text-medium-emphasis">Contenu de démonstration prêt pour branchement API.</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
