<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'
import { platformProposals } from '~/data/platform-enhanced'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const { t } = useI18n()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const ticketStats = computed(() => {
  const tickets = platformProposals.recruit

  return [
    { label: t('platform.recruit.tickets.boardTitle'), value: tickets.length, icon: 'mdi-ticket-outline', color: 'primary' },
    { label: 'P0', value: tickets.filter((ticket) => ticket.priority === 'P0').length, icon: 'mdi-alert-circle-outline', color: 'error' },
    { label: 'P1', value: tickets.filter((ticket) => ticket.priority === 'P1').length, icon: 'mdi-progress-clock', color: 'warning' },
    { label: 'P2', value: tickets.filter((ticket) => ticket.priority === 'P2').length, icon: 'mdi-flag-outline', color: 'info' },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.tickets" subtitle="platform.common.sidebar.roadmap" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.recruit.hero.tickets.title" subtitle="platform.recruit.hero.tickets.subtitle" cta="platform.recruit.hero.tickets.cta" />

      <RecruitPageSection
        :title="t('platform.recruit.tickets.boardTitle')"
        subtitle="Roadmap et priorisation du pipeline recrutement"
        :stats="ticketStats"
        content-variant="outlined"
      >
        <PlatformTicketBoard :title="t('platform.recruit.tickets.boardTitle')" :tickets="platformProposals.recruit" />
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
