<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals, shopCatalogMedia } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.shop.hero.promotions.title" subtitle="platform.shop.hero.promotions.subtitle" cta="platform.shop.hero.promotions.cta" />
      <v-row>
        <v-col v-for="item in shopCatalogMedia" :key="item.id" cols="12" md="4">
          <PlatformMediaCard :item="item" />
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-6" title="Tickets Shop" :tickets="platformProposals.shop" />
    </section>
  </PlatformSplitLayout>
</template>
