<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import { schoolCampusMedia } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getSchoolNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Student Experience" subtitle="Engagement, progression académique et vie campus" cta="Ajouter étudiant" />
      <v-row>
        <v-col v-for="item in schoolCampusMedia" :key="item.id" cols="12" md="4">
          <PlatformMediaCard :item="item" />
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
