<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmTickets, recruitCandidates } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'

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
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="CRM" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Contacts 360" subtitle="Vue complète de vos contacts, contextes et interactions" cta="Ajouter contact" />
      <v-row>
        <v-col v-for="candidate in recruitCandidates" :key="candidate.id" cols="12" md="4">
          <PlatformMediaCard :item="candidate" />
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-6" title="Tickets CRM prioritaires" :tickets="crmTickets" />
    </section>
  </PlatformSplitLayout>
</template>
