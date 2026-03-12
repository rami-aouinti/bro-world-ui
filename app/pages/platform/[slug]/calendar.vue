<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav, getRecruitNav, getSchoolNav, getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isAuthenticated } = useAuth()
const { isOwner, application, resolveApplication } = usePlatformPermissions(slug)
const resolvingApplication = ref(true)

const platformKey = computed(() => application.value?.platformKey?.toLowerCase() ?? 'crm')

const navItems = computed(() => {
  if (platformKey.value === 'shop') {
    return getShopNav(slug.value, isOwner.value)
  }

  if (platformKey.value === 'recruit') {
    return getRecruitNav(slug.value, isOwner.value, isAuthenticated.value)
  }

  if (platformKey.value === 'school') {
    return getSchoolNav(slug.value, isOwner.value)
  }

  return getCrmNav(slug.value, isOwner.value)
})

onMounted(async () => {
  try {
    await resolveApplication()
  }
  finally {
    resolvingApplication.value = false
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="platform.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <template v-if="resolvingApplication">
      <v-skeleton-loader type="card, image" />
    </template>
    <CalendarView v-else :application-slug="slug" />
  </PlatformSplitLayout>
</template>
