<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'
import { recruitCandidates } from '~/data/platform-enhanced'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const candidateStats = computed(() => [
  { label: 'Shortlisted candidates', value: recruitCandidates.length, icon: 'mdi-account-check-outline', color: 'primary' },
  { label: 'Score moyen', value: '88', icon: 'mdi-chart-line', color: 'success' },
  { label: 'Profils remote', value: recruitCandidates.filter((candidate) => candidate.subtitle.includes('Remote')).length, icon: 'mdi-home-city-outline', color: 'info' },
  { label: 'Stacks actives', value: '9+', icon: 'mdi-code-tags', color: 'warning' },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.recruit.hero.candidates.title" subtitle="platform.recruit.hero.candidates.subtitle" cta="platform.recruit.hero.candidates.cta" />
      <RecruitPageSection
        title="Vivier candidats"
        subtitle="Selection and tracking of qualified profiles"
        :stats="candidateStats"
      >
        <v-row>
          <v-col v-for="candidate in recruitCandidates" :key="candidate.id" cols="12" md="4">
            <PlatformMediaCard :item="candidate" />
          </v-col>
        </v-row>
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
