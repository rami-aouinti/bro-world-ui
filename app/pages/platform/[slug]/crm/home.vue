<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmCompanies, crmStats, type NavItem } from '~/data/platform-demo'
import { platformProposals } from '~/data/platform-enhanced'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const isOwner = computed(() => true)

const crmNav = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/crm`
  const items: NavItem[] = [
    { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: `${base}/home` },
    { title: 'Companies', icon: 'mdi-office-building-outline', to: `${base}/companies` },
    { title: 'Projects', icon: 'mdi-briefcase-outline', to: `${base}/projects` },
    { title: 'Contacts', icon: 'mdi-account-group-outline', to: `${base}/contacts` },
    { title: 'Reports', icon: 'mdi-chart-line', to: `${base}/reports` },
    { title: 'Automation', icon: 'mdi-robot-outline', to: `${base}/automation` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
  if (isOwner.value) items.push({ title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` })
  return items
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="CRM" :subtitle="`Application ${slug}`" :items="crmNav" /></template>
    <section>
      <PlatformHeroHeader title="CRM Dashboard" subtitle="Pilotage commercial complet avec vues actionnables et backlog tickets." cta="Nouveau lead" />
      <v-row class="mb-2">
        <v-col v-for="stat in crmStats" :key="stat.label" cols="12" sm="6" lg="3">
          <v-card rounded="xl" variant="tonal" :color="stat.color || 'primary'" class="h-100">
            <v-card-text>
              <p class="text-caption text-uppercase mb-1">{{ stat.label }}</p>
              <p class="text-h5 font-weight-bold mb-1">{{ stat.value }}</p>
              <p class="text-caption">{{ stat.trend }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="company in crmCompanies" :key="company.id" cols="12" md="6" xl="4">
          <v-card rounded="xl" class="crm-company-card h-100" hover>
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <p class="text-subtitle-1 font-weight-bold">{{ company.name }}</p>
                <v-chip size="small" :color="company.status === 'Active' ? 'success' : company.status === 'Prospect' ? 'info' : 'warning'" variant="tonal">{{ company.status }}</v-chip>
              </div>
              <p class="text-body-2 text-medium-emphasis">{{ company.sector }} · {{ company.size }} employés</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-5" title="Tickets CRM prioritaires" :tickets="platformProposals.crm" />
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.crm-company-card { transition: transform 180ms ease, box-shadow 180ms ease; }
.crm-company-card:hover { transform: translateY(-4px); }
</style>
