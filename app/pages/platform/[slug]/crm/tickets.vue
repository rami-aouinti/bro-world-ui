<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals } from '~/data/platform-enhanced'
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
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="CRM Tickets" :subtitle="`Roadmap ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Tickets CRM" subtitle="Backlog priorisé avec owners, ETA et impacts" cta="Nouveau ticket" />
      <PlatformTicketBoard title="Backlog CRM" :tickets="platformProposals.crm" />
    </section>
  </PlatformSplitLayout>
</template>
