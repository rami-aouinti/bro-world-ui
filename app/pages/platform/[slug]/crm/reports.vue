<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmTickets } from '~/data/platform-enhanced'
import { crmStats, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/crm`
  return [
    { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: `${base}/home` },
    { title: 'Contacts', icon: 'mdi-account-group-outline', to: `${base}/contacts` },
    { title: 'Reports', icon: 'mdi-chart-line', to: `${base}/reports` },
    { title: 'Automation', icon: 'mdi-robot-outline', to: `${base}/automation` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="CRM Reports" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Rapports & Forecast" subtitle="KPIs temps réel, conversion, MRR et performance équipes" cta="Exporter" />
      <v-row class="mb-2">
        <v-col v-for="stat in crmStats" :key="stat.label" cols="12" sm="6" lg="3">
          <v-card rounded="xl" variant="tonal" :color="stat.color || 'primary'">
            <v-card-text>
              <div class="text-caption mb-1">{{ stat.label }}</div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption">{{ stat.trend }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <PlatformTicketBoard title="Actions recommandées" :tickets="crmTickets" />
    </section>
  </PlatformSplitLayout>
</template>
