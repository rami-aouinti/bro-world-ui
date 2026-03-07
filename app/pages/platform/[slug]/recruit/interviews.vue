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
const interviewSlots = [
  { role: 'Senior Frontend Engineer', interviewer: 'CTO', date: 'Mer 10:30', type: 'Tech interview' },
  { role: 'Product Designer II', interviewer: 'Head of Design', date: 'Jeu 14:00', type: 'Case study' },
  { role: 'Data Analyst Growth', interviewer: 'Lead Data', date: 'Ven 11:00', type: 'Business case' },
]
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/recruit`
  return [
    { title: 'Jobs', icon: 'mdi-briefcase-search-outline', to: `${base}/home` },
    { title: 'Candidates', icon: 'mdi-account-tie-outline', to: `${base}/candidates` },
    { title: 'Interviews', icon: 'mdi-calendar-account-outline', to: `${base}/interviews` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Recruit Interviews" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Interview Planner" subtitle="Planning, feedback loop et time-to-hire" cta="Planifier" />
      <v-timeline density="compact" side="end" truncate-line="both">
        <v-timeline-item v-for="slot in interviewSlots" :key="slot.role" dot-color="primary" size="small">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ slot.role }}</p>
              <p class="text-body-2">{{ slot.type }} · {{ slot.date }}</p>
              <p class="text-caption text-medium-emphasis">Interviewer: {{ slot.interviewer }}</p>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
      <PlatformTicketBoard title="Backlog Recruit" :tickets="platformProposals.recruit" />
    </section>
  </PlatformSplitLayout>
</template>
