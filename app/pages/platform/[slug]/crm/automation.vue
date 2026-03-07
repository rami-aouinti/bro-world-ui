<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { crmTickets } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const automations = [
  { name: 'Welcome sequence', trigger: 'Nouveau lead', status: 'Actif', impact: '+18% activation' },
  { name: 'Deal follow-up', trigger: 'Devis ouvert > 3 jours', status: 'Actif', impact: '+11% conversion' },
  { name: 'Renewal alert', trigger: 'J-45 fin contrat', status: 'Pilot', impact: '-7% churn' },
]

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
    <template #sidebar><PlatformSidebarNav title="CRM Automation" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Automation Center" subtitle="Orchestrez workflows et scoring automatiques" cta="Créer workflow" />
      <v-row>
        <v-col v-for="item in automations" :key="item.name" cols="12" md="4">
          <v-card rounded="xl" variant="outlined" class="h-100">
            <v-card-text>
              <p class="font-weight-bold mb-1">{{ item.name }}</p>
              <p class="text-body-2 text-medium-emphasis">Trigger: {{ item.trigger }}</p>
              <div class="d-flex justify-space-between mt-3">
                <v-chip size="small" color="success" variant="tonal">{{ item.status }}</v-chip>
                <v-chip size="small" color="primary" variant="outlined">{{ item.impact }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert class="mt-5" variant="tonal" type="info">{{ crmTickets[0].description }}</v-alert>
    </section>
  </PlatformSplitLayout>
</template>
