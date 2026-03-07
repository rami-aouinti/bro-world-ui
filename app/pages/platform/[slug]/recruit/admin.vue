<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import RecruitPipelineBoard from '~/components/platform/sections/RecruitPipelineBoard.vue'
import { platformPageSections } from '~/data/platform-demo'
import { recruitAdminSections } from '~/data/platform-enhanced'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed(() => getRecruitNav(slug.value, true))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Recruit" :subtitle="`Admin ${slug}`" :items="navItems" /></template>
    <section>
      <RecruitPipelineBoard
        :title="platformPageSections.recruit.pageTitle"
        :sections-meta="platformPageSections.recruit.sections"
        :section-data="recruitAdminSections"
      />
    </section>
  </PlatformSplitLayout>
</template>
