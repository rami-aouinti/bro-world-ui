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
const navItems = computed(() => getRecruitNav(slug.value, false))
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
