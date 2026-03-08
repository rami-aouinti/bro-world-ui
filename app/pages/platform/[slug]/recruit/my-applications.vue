<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
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
  { label: 'Acceptées', value: applications.value.filter((app) => app.status === 'ACCEPTED').length, icon: 'mdi-check-circle-outline', color: 'success' },
  { label: 'En attente', value: applications.value.filter((app) => app.status === 'WAITING').length, icon: 'mdi-timer-sand', color: 'warning' },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" />
    </template>

    <section>
      <PlatformHeroHeader
        title="platform.recruit.hero.myApplications.title"
        subtitle="platform.recruit.hero.myApplications.subtitle"
        cta="platform.recruit.hero.myApplications.cta"
      />

      <RecruitPageSection
        title="Mes candidatures"
        subtitle="Suivi des statuts sur les offres postées"
        :stats="applicationStats"
      >
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
