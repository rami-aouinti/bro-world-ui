<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import RecruitJobsFiltersPanel from '~/components/platform/recruit/RecruitJobsFiltersPanel.vue'
import RecruitJobList from '~/components/platform/recruit/RecruitJobList.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'
import { getRecruitNav } from '~/data/platform-nav'
import { refreshRecruitMeJobsState } from '~/composables/useRecruitMeJobs'
import { useRecruitHome } from '~/composables/recruit/useRecruitHome'

definePageMeta({ public: true, requiresAuth: false })

const RecruitJobEditDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitJobEditDialog.vue'))
const RecruitApplyDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitApplyDialog.vue'))
const loading = ref(true)
const route = useRoute()
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const {
  slug,
  currentPage,
  filters,
  hasFilters,
  jobsData,
  loadJobs,
  pending,
  error,
  totalPages,
  isAuthenticated,
  createDialog,
  editDialog,
  deleteDialog,
  createForm,
  editForm,
  applyDialog,
  selectedApplyJob,
  applyForm,
  applyError,
  applyLoading,
  canSubmitApplication,
  resumesStore,
  selectedResume,
  selectedResumeId,
  resumeMode,
  resumeForm,
  resumeSaving,
  resumeDeleting,
  ownerActionError,
  createLoading,
  editLoading,
  deleteLoading,
  selectedJob,
  resetFilters,
  openCreateDialog,
  openEditDialog,
  openDeleteDialog,
  closeOwnerDialogs,
  openApplyDialog,
  closeApplyDialog,
  handleResumeFileChange,
  submitCreateJob,
  submitEditJob,
  submitDeleteJob,
  submitApply,
  saveSelectedResume,
  deleteSelectedResume,
} = useRecruitHome()

const { isOwner } = usePlatformPermissions(slug)
const { t } = useI18n()
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
const visibleJobsCount = computed(() => jobsData.value?.jobs?.length ?? 0)
const shouldRenderEditDialog = computed(() => editDialog.value || editLoading.value)
const shouldRenderApplyDialog = computed(() => applyDialog.value || applyLoading.value)

onMounted(async () => {
  try {
    await loadJobs()
    await nextTick()
  } finally {
    loading.value = false
  }
})


const handleEditJob = async () => {
  if (await submitEditJob()) {
    await refreshRecruitMeJobsState(slug.value)
  }
}

const handleDeleteJob = async () => {
  if (await submitDeleteJob()) {
    await refreshRecruitMeJobsState(slug.value)
  }
}

const handleApplyToJob = async () => {
  if (await submitApply()) {
    await refreshRecruitMeJobsState(slug.value)
  }
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems"/>
    </template>

    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        {{ t('platform.recruit.home.alerts.accessDenied') }}
      </v-alert>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ t('platform.recruit.home.alerts.jobsLoadError') }}
      </v-alert>

       <RecruitPageSection
      >
        <template #actions>

          <RecruitJobsFiltersPanel v-model="filters" :has-filters="hasFilters" @reset="resetFilters" />
        </template>

        <v-skeleton-loader v-if="loading" type="article" class="mb-4" />

        <RecruitJobList
            v-else
          :jobs="jobsData?.jobs ?? []"
          :slug="slug"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
          @apply="openApplyDialog"
        />

        <v-alert v-if="!pending && !(jobsData?.jobs?.length ?? 0)" type="info" variant="tonal">
          {{ t('platform.recruit.home.alerts.emptyJobs') }}
        </v-alert>

        <div class="d-flex justify-center mt-6">
          <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7" rounded="circle" />
        </div>
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>

  <RecruitJobEditDialog
    v-if="shouldRenderEditDialog"
    v-model="editDialog"
    v-model:form="editForm"
    :loading="editLoading"
    :error="ownerActionError"
    @close="closeOwnerDialogs"
    @submit="handleEditJob"
  />

  <v-dialog retain-focus v-model="deleteDialog" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">{{ t('platform.recruit.home.deleteDialog.title') }}</v-card-title>
      <v-card-text class="px-6">
        <v-alert v-if="ownerActionError" type="error" variant="tonal" class="mb-4">{{ ownerActionError }}</v-alert>
        <p class="text-body-1 mb-0">
          {{ t('platform.recruit.home.deleteDialog.confirmPrefix') }}
          <span class="font-weight-bold">{{ selectedJob?.title }}</span>
          ?
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="closeOwnerDialogs">{{ t('platform.recruit.home.actions.cancel') }}</v-btn>
        <v-btn color="error" :loading="deleteLoading" @click="handleDeleteJob">{{ t('platform.recruit.home.actions.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <RecruitApplyDialog
    v-if="shouldRenderApplyDialog"
    v-model="applyDialog"
    v-model:apply-form="applyForm"
    v-model:resume-form="resumeForm"
    v-model:resume-mode="resumeMode"
    v-model:selected-resume-id="selectedResumeId"
    :selected-apply-job="selectedApplyJob"
    :apply-error="applyError"
    :apply-loading="applyLoading"
    :can-submit-application="canSubmitApplication"
    :resumes-store="resumesStore"
    :selected-resume="selectedResume"
    :resume-saving="resumeSaving"
    :resume-deleting="resumeDeleting"
    @close="closeApplyDialog"
    @submit="handleApplyToJob"
    @save-resume="saveSelectedResume"
    @delete-resume="deleteSelectedResume"
    @file-change="handleResumeFileChange"
  />
</template>
