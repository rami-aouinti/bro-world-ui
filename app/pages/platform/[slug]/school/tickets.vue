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
  const base = `/platform/${slug.value}/school`
  return [
    { title: 'Classes', icon: 'mdi-google-classroom', to: `${base}/home` },
    { title: 'Students', icon: 'mdi-account-school-outline', to: `${base}/students` },
    { title: 'Teachers', icon: 'mdi-teach', to: `${base}/teachers` },
    { title: 'Timetable', icon: 'mdi-calendar-clock-outline', to: `${base}/timetable` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School Tickets" :subtitle="`Roadmap ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Tickets School" subtitle="Priorités académiques, pédagogie, planning et communication" cta="Nouveau ticket" />
      <PlatformTicketBoard title="Backlog School" :tickets="platformProposals.school" />
    </section>
  </PlatformSplitLayout>
</template>
