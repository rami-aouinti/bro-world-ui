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
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const { isAuthenticated } = useAuth()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const { t } = useI18n()
const accessDenied = ref(false)

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
      <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-4">
        {{ t('platform.recruit.admin.accessDenied') }}
      </v-alert>
      <RecruitPipelineBoard
        v-else
        :title="platformPageSections.recruit.pageTitle"
        :sections-meta="platformPageSections.recruit.sections"
        :section-data="recruitAdminSections"
      />
    </section>
  </PlatformSplitLayout>
</template>
