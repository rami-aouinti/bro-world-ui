<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.tickets" subtitle="platform.common.sidebar.roadmap" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.shop.hero.tickets.title" subtitle="platform.shop.hero.tickets.subtitle" cta="platform.shop.hero.tickets.cta" />
      <PlatformTicketBoard :title="t('platform.shop.tickets.backlogTitle')" :tickets="platformProposals.shop" />
    </section>
  </PlatformSplitLayout>
</template>
