<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getRecruitNav } from '~/data/platform-nav'
import RecruitJobCard from '~/components/platform/recruit/RecruitJobCard.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))

const { data, pending, error } = useRecruitMeJobs(slug)
const { t, locale } = useI18n()
const applications = computed(() => data.value?.appliedJobs ?? [])
const applicationStatusLabelMap = {
  WAITING: 'platform.recruit.status.waiting',
  REVIEWING: 'platform.recruit.status.reviewing',
  INTERVIEW: 'platform.recruit.status.interview',
  REJECTED: 'platform.recruit.status.rejected',
  ACCEPTED: 'platform.recruit.status.accepted',
} as const

const getApplicationStatusLabel = (status: string) => t(applicationStatusLabelMap[status as keyof typeof applicationStatusLabelMap] ?? 'platform.recruit.status.waiting')
const applicationStats = computed(() => [
  { label: 'Candidatures', value: applications.value.length, icon: 'mdi-file-account-outline', color: 'primary' },
  { label: 'En review', value: applications.value.filter((app) => ['REVIEWING', 'INTERVIEW'].includes(app.status)).length, icon: 'mdi-account-search-outline', color: 'info' },
  { label: 'Accepted', value: applications.value.filter((app) => app.status === 'ACCEPTED').length, icon: 'mdi-check-circle-outline', color: 'success' },
  { label: 'En attente', value: applications.value.filter((app) => app.status === 'WAITING').length, icon: 'mdi-timer-sand', color: 'warning' },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav :items="navItems" />
    </template>

    <section>

      <RecruitPageSection>
        <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
          {{ t('platform.recruit.myApplications.alerts.signInRequired') }}
        </v-alert>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
          {{ t('platform.recruit.myApplications.alerts.loadError') }}
        </v-alert>

        <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

        <transition-group name="recruit-list" tag="div">
          <RecruitJobCard
            v-for="application in applications"
            :key="application.applicationId"
            class="recruit-card--interactive"
            variant="detailed"
            :to="`/platform/${slug}/recruit/job/${application.job.slug}`"
            :title="application.job.title"
            :company="application.job.company"
            :location="application.job.location"
            :meta="`${application.job.contractType} · ${application.job.workMode} · ${application.job.schedule}`"
            :posted-at="t('platform.recruit.myApplications.appliedOn', { date: new Date(application.appliedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') })"
            :status-badge="{ label: getApplicationStatusLabel(application.status), color: 'primary', variant: 'tonal' }"
          />
        </transition-group>

        <v-alert v-if="isAuthenticated && !pending && !applications.length" type="info" variant="tonal">
          {{ t('platform.recruit.myApplications.alerts.empty') }}
        </v-alert>
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>


<style scoped>
.recruit-card--interactive {
  transition:
    transform var(--recruit-motion-duration-fast, 150ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1)),
    box-shadow var(--recruit-motion-duration-base, 220ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1));
  will-change: transform, box-shadow;
}

.recruit-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.recruit-list-enter-active,
.recruit-list-leave-active,
.recruit-list-move {
  transition:
    opacity var(--recruit-motion-duration-fast, 150ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1)),
    transform var(--recruit-motion-duration-base, 220ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1));
}

.recruit-list-enter-from,
.recruit-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .recruit-card--interactive,
  .recruit-list-enter-active,
  .recruit-list-leave-active,
  .recruit-list-move {
    transition-duration: 1ms !important;
  }

  .recruit-card--interactive:hover,
  .recruit-list-enter-from,
  .recruit-list-leave-to {
    transform: none !important;
  }
}
</style>
