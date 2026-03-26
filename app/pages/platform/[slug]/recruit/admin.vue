<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import RecruitPipelineBoard from '~/components/platform/sections/RecruitPipelineBoard.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'
import { platformPageSections } from '~/data/platform-demo'
import { recruitAdminSections } from '~/data/platform-enhanced'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false, requiresPlatformAdmin: true, platformDomain: 'recruit' })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const { isAuthenticated } = useAuth()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const { t } = useI18n()
const accessDenied = ref(false)
const adminStats = computed(() => [
  { label: 'Pipelines', value: recruitAdminSections.pipeline.length, icon: 'mdi-source-branch', color: 'primary' },
  { label: 'Interviews', value: recruitAdminSections.interviews.length, icon: 'mdi-account-voice', color: 'info' },
  { label: 'Offers', value: recruitAdminSections.offers.length, icon: 'mdi-file-sign', color: 'success' },
  { label: 'Modules', value: 3, icon: 'mdi-view-dashboard-outline', color: 'warning' },
])

onMounted(async () => {
  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      navigateTo(platformPermissions.getDeniedRedirectPath('recruit'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.admin" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <RecruitPageSection
        :title="platformPageSections.recruit.pageTitle"
        subtitle="Pilotage admin des workflows recrutement"
        :stats="adminStats"
      >
        <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-4">
          {{ t('platform.recruit.admin.accessDenied') }}
        </v-alert>
        <RecruitPipelineBoard
          v-else
          :title="platformPageSections.recruit.pageTitle"
          :sections-meta="platformPageSections.recruit.sections"
          :section-data="recruitAdminSections"
        />
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
