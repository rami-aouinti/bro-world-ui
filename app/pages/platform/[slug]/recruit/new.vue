<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'
import { getRecruitNav } from '~/data/platform-nav'
import { useRecruitHome } from '~/composables/recruit/useRecruitHome'
import {defineAsyncComponent} from "vue";
const RecruitJobEditDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitJobEditDialog.vue'))

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const {
  createDialog,
  submitCreateJob,
  createForm,
  createLoading,
  ownerActionError,
  closeOwnerDialogs,
} = useRecruitHome()

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const handleCreateJob = async () => {
  if (await submitCreateJob()) {
    await refreshRecruitMeJobsState(slug.value)
  }
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav :items="navItems" /></template>
    <section>
      <RecruitPageSection
      >
        <RecruitJobCreateDialog
            v-model="createDialog"
            v-model:form="createForm"
            :loading="createLoading"
            :error="ownerActionError"
            @close="closeOwnerDialogs"
            @submit="handleCreateJob"
        />
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
