<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import { recruitCandidates } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/recruit`
  return [
    { title: 'Jobs', icon: 'mdi-briefcase-search-outline', to: `${base}/home` },
    { title: 'Candidates', icon: 'mdi-account-tie-outline', to: `${base}/candidates` },
    { title: 'Interviews', icon: 'mdi-calendar-account-outline', to: `${base}/interviews` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Recruit" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Candidate Hub" subtitle="Shortlist, scoring, portfolio et matching compétences" cta="Ajouter candidat" />
      <v-row>
        <v-col v-for="candidate in recruitCandidates" :key="candidate.id" cols="12" md="4">
          <PlatformMediaCard :item="candidate" />
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
