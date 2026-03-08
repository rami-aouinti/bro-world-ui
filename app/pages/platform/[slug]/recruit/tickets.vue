<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const { t } = useI18n()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.tickets" subtitle="platform.common.sidebar.roadmap" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.recruit.hero.tickets.title" subtitle="platform.recruit.hero.tickets.subtitle" cta="platform.recruit.hero.tickets.cta" />
      <PlatformTicketBoard :title="t('platform.recruit.tickets.boardTitle')" :tickets="platformProposals.recruit" />
    </section>
  </PlatformSplitLayout>
</template>
