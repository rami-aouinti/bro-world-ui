<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals, shopCatalogMedia } from '~/data/platform-enhanced'
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
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Promotions & Campaigns" subtitle="Collections, offres limitées, bundles et optimisation conversion" cta="Créer campagne" />
      <v-row>
        <v-col v-for="item in shopCatalogMedia" :key="item.id" cols="12" md="4">
          <PlatformMediaCard :item="item" />
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-6" title="Tickets Shop" :tickets="platformProposals.shop" />
    </section>
  </PlatformSplitLayout>
</template>
