<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import RecruitJobsFiltersPanel from '~/components/platform/recruit/RecruitJobsFiltersPanel.vue'
import RecruitJobList from '~/components/platform/recruit/RecruitJobList.vue'
import { getRecruitNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const RecruitJobCreateDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitJobCreateDialog.vue'))
const RecruitJobEditDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitJobEditDialog.vue'))
const RecruitApplyDialog = defineAsyncComponent(() => import('~/components/platform/recruit/RecruitApplyDialog.vue'))

const route = useRoute()
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const {
  slug,
  currentPage,
  filters,
  hasFilters,
  jobsData,
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
} = await useRecruitHome()

const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems">
        <RecruitJobsFiltersPanel v-model="filters" :has-filters="hasFilters" @reset="resetFilters" />
      </PlatformSidebarNav>
    </template>

    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        Accès admin refusé : permissions insuffisantes pour cette application.
      </v-alert>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        Impossible de charger les offres d'emploi pour le moment.
      </v-alert>

      <div class="d-flex justify-space-between align-start flex-wrap ga-3 mb-2">
        <PlatformHeroHeader
          title="platform.recruit.hero.home.title"
          subtitle="platform.recruit.hero.home.subtitle"
          cta="platform.recruit.hero.home.cta"
        />
        <v-btn
          v-if="isAuthenticated"
          color="primary"
          prepend-icon="mdi-briefcase-plus"
          @click="openCreateDialog"
        >
          Create New Job
        </v-btn>
      </div>

      <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

      <RecruitJobList
        :jobs="jobsData.jobs"
        :slug="slug"
        @edit="openEditDialog"
        @delete="openDeleteDialog"
        @apply="openApplyDialog"
      />

      <v-alert v-if="!pending && !jobsData.jobs.length" type="info" variant="tonal">
        Aucune offre trouvée. Essayez d'ajuster les filtres pour élargir la recherche.
      </v-alert>

      <div class="d-flex justify-center mt-6">
        <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7" rounded="circle" />
      </div>
    </section>
  </PlatformSplitLayout>

  <RecruitJobCreateDialog
    v-model="createDialog"
    v-model:form="createForm"
    :loading="createLoading"
    :error="ownerActionError"
    @close="closeOwnerDialogs"
    @submit="submitCreateJob"
  />

  <RecruitJobEditDialog
    v-model="editDialog"
    v-model:form="editForm"
    :loading="editLoading"
    :error="ownerActionError"
    @close="closeOwnerDialogs"
    @submit="submitEditJob"
  />

  <v-dialog v-model="deleteDialog" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">Supprimer l'offre</v-card-title>
      <v-card-text class="px-6">
        <v-alert v-if="ownerActionError" type="error" variant="tonal" class="mb-4">{{ ownerActionError }}</v-alert>
        <p class="text-body-1 mb-0">
          Confirmez la suppression de l'offre
          <span class="font-weight-bold">{{ selectedJob?.title }}</span>
          ?
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="closeOwnerDialogs">Annuler</v-btn>
        <v-btn color="error" :loading="deleteLoading" @click="submitDeleteJob">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <RecruitApplyDialog
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
    @submit="submitApply"
    @save-resume="saveSelectedResume"
    @delete-resume="deleteSelectedResume"
    @file-change="handleResumeFileChange"
  />
</template>
