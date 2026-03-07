<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { crmCompanies, crmProjects, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const isOwner = computed(() => true)
const titleMap: Record<string, string> = {
  companies: 'Companies',
  projects: 'Projects',
  sprint: 'Sprint Board',
  calendar: 'Calendar',
  settings: 'Settings',
  billing: 'Billing',
  admin: 'Admin CRM',
}

const crmNav = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/crm`
  const items: NavItem[] = [
    { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: `${base}/home` },
    { title: 'Companies', icon: 'mdi-office-building-outline', to: `${base}/companies` },
    { title: 'Projects', icon: 'mdi-briefcase-outline', to: `${base}/projects` },
    { title: 'Sprint', icon: 'mdi-run-fast', to: `${base}/sprint` },
    { title: 'Calendar', icon: 'mdi-calendar-month-outline', to: `${base}/calendar` },
    { title: 'Setting', icon: 'mdi-cog-outline', to: `${base}/settings` },
    { title: 'Billing', icon: 'mdi-credit-card-outline', to: `${base}/billing` },
  ]
  if (isOwner.value) items.push({ title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` })
  return items
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="CRM" :subtitle="`Application ${slug}`" :items="crmNav" />
    </template>

    <section>
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
        <v-col cols="12" md="6" lg="4" v-for="i in 6" :key="i">
          <v-card rounded="xl" variant="outlined" class="h-100">
            <v-card-text>
              <p class="text-subtitle-2 font-weight-bold">{{ titleMap[page] }} card #{{ i }}</p>
              <p class="text-body-2 text-medium-emphasis">Contenu de démonstration prêt pour branchement API.</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
