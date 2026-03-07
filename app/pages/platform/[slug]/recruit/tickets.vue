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
const navItems = computed(() => getRecruitNav(slug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Recruit Tickets" :subtitle="`Roadmap ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Tickets Recruit" subtitle="Pipeline talent, expérience candidat, analytics recrutement" cta="Nouveau ticket" />
      <PlatformTicketBoard title="Backlog Recruit" :tickets="platformProposals.recruit" />
    </section>
  </PlatformSplitLayout>
</template>
