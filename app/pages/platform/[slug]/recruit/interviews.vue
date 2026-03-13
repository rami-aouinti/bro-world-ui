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
const interviewSlots = [
  { role: 'Senior Frontend Engineer', interviewer: 'CTO', date: 'Wed 10:30', type: t('platform.recruit.interviews.slotTypes.techInterview') },
  { role: 'Product Designer II', interviewer: 'Head of Design', date: 'Thu 14:00', type: t('platform.recruit.interviews.slotTypes.caseStudy') },
  { role: 'Data Analyst Growth', interviewer: 'Lead Data', date: 'Fri 11:00', type: t('platform.recruit.interviews.slotTypes.businessCase') },
]
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const interviewStats = computed(() => [
  { label: 'Planned interviews', value: interviewSlots.length, icon: 'mdi-calendar-clock', color: 'primary' },
  { label: 'Panels techniques', value: interviewSlots.filter((slot) => slot.type === t('platform.recruit.interviews.slotTypes.techInterview')).length, icon: 'mdi-laptop', color: 'info' },
  { label: 'Cette semaine', value: interviewSlots.length, icon: 'mdi-calendar-week', color: 'success' },
  { label: 'Linked tickets', value: platformProposals.recruit.length, icon: 'mdi-ticket-confirmation-outline', color: 'warning' },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.interviews" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.recruit.hero.interviews.title" subtitle="platform.recruit.hero.interviews.subtitle" cta="platform.recruit.hero.interviews.cta" />
      <RecruitPageSection
        title="Planning des entretiens"
        subtitle="Suivi rapide des slots et coordination des panels"
        :stats="interviewStats"
      >
        <v-timeline density="compact" side="end" truncate-line="both">
          <v-timeline-item v-for="slot in interviewSlots" :key="slot.role" dot-color="primary" size="small">
            <v-card rounded="xl" variant="outlined">
              <v-card-text>
                <p class="font-weight-bold">{{ slot.role }}</p>
                <p class="text-body-2">{{ slot.type }} · {{ slot.date }}</p>
                <p class="text-caption text-medium-emphasis">{{ t('platform.recruit.interviews.interviewer', { interviewer: slot.interviewer }) }}</p>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <PlatformTicketBoard class="mt-4" :title="t('platform.recruit.tickets.boardTitle')" :tickets="platformProposals.recruit" />
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
