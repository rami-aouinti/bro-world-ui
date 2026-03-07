<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import CrmSettingsPanel from '~/components/platform/sections/CrmSettingsPanel.vue'
import { platformPageSections } from '~/data/platform-demo'
import { crmSettingsSections } from '~/data/platform-enhanced'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const isOwner = computed(() => true)

const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="CRM" :subtitle="`Application ${slug}`" :items="crmNav" />
    </template>

    <section>
      <CrmSettingsPanel
        :title="platformPageSections.crm.pageTitle"
        :sections-meta="platformPageSections.crm.sections"
        :section-data="crmSettingsSections"
      />
    </section>
  </PlatformSplitLayout>
</template>
