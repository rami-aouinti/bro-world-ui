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
  const base = `/platform/${slug.value}/shop`
  return [
    { title: 'Home', icon: 'mdi-storefront-outline', to: `${base}/home` },
    { title: 'Promotions', icon: 'mdi-sale-outline', to: `${base}/promotions` },
    { title: 'Customers', icon: 'mdi-account-group-outline', to: `${base}/customers` },
    { title: 'Reviews', icon: 'mdi-star-outline', to: `${base}/reviews` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop Tickets" :subtitle="`Roadmap ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Tickets Shop" subtitle="Propositions d'amélioration design, data, conversion et fidélité" cta="Nouveau ticket" />
      <PlatformTicketBoard title="Backlog Shop" :tickets="platformProposals.shop" />
    </section>
  </PlatformSplitLayout>
</template>
