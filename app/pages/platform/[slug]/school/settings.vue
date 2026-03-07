<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import SchoolSettingsForm from '~/components/platform/sections/SchoolSettingsForm.vue'
import { platformPageSections } from '~/data/platform-demo'
import { schoolSettingsSections } from '~/data/platform-enhanced'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const navItems = computed(() => getSchoolNav(slug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <SchoolSettingsForm
        :title="platformPageSections.school.pageTitle"
        :sections-meta="platformPageSections.school.sections"
        :section-data="schoolSettingsSections"
      />
    </section>
  </PlatformSplitLayout>
</template>
