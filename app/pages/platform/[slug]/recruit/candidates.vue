<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import { recruitCandidates } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.recruit.hero.candidates.title" subtitle="platform.recruit.hero.candidates.subtitle" cta="platform.recruit.hero.candidates.cta" />
      <v-row>
        <v-col v-for="candidate in recruitCandidates" :key="candidate.id" cols="12" md="4">
          <PlatformMediaCard :item="candidate" />
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
