<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { getRecruitNav } from '~/data/platform-nav'

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

      <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
        {{ t('platform.recruit.myApplications.alerts.signInRequired') }}
      </v-alert>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ t('platform.recruit.myApplications.alerts.loadError') }}
      </v-alert>

      <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

      <v-card
        v-for="application in applications"
        :key="application.applicationId"
        rounded="xl"
        class="mb-4 border"
        hover
        :to="`/platform/${slug}/recruit/job/${application.job.slug}`"
      >
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <h2 class="text-h5 font-weight-bold">{{ application.job.title }}</h2>
            <v-chip size="small" color="primary" variant="tonal">{{ getApplicationStatusLabel(application.status) }}</v-chip>
          </div>
          <p class="text-body-1 mb-2">{{ application.job.company }} · {{ application.job.location }}</p>
          <p class="text-body-2 text-medium-emphasis mb-1">{{ application.job.contractType }} · {{ application.job.workMode }} · {{ application.job.schedule }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ t('platform.recruit.myApplications.appliedOn', { date: new Date(application.appliedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') }) }}</p>
        </v-card-text>
      </v-card>

      <v-alert v-if="isAuthenticated && !pending && !applications.length" type="info" variant="tonal">
        {{ t('platform.recruit.myApplications.alerts.empty') }}
      </v-alert>
    </section>
  </PlatformSplitLayout>
</template>
