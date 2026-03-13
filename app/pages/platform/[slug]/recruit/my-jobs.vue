<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getRecruitNav } from '~/data/platform-nav'
import RecruitJobCard from '~/components/platform/recruit/RecruitJobCard.vue'
import RecruitPageSection from '~/components/platform/recruit/RecruitPageSection.vue'

definePageMeta({ public: true, requiresAuth: false })


type RecruitJobsStatsResponse = {
  total?: number
  published?: number
  draft?: number
}
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated, initSession } = useAuth()
const { apiFetch } = useApiClient()

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))

const { data, pending, error } = useRecruitMeJobs(slug)
const { t, locale } = useI18n()

const { data: jobsStats } = useAsyncData(
  () => `recruit-jobs-stats-${slug.value}`,
  async () => {
    await initSession()

    if (!isAuthenticated.value) {
      return { total: 0, published: 0, draft: 0 }
    }

    return await apiFetch<RecruitJobsStatsResponse>(`/api/v1/recruit/applications/${slug.value}/private/jobs/stats`, {
      method: 'GET',
    })
  },
  {
    watch: [slug, isAuthenticated],
    default: () => ({ total: 0, published: 0, draft: 0 }),
    server: false,
  },
)
const jobs = computed(() => data.value?.createdJobs ?? [])
const jobStats = computed(() => [
  { label: 'Total', value: jobsStats.value?.total ?? jobs.value.length, icon: 'mdi-briefcase-outline', color: 'primary' },
  { label: 'Publishedes', value: jobsStats.value?.published ?? 0, icon: 'mdi-check-decagram-outline', color: 'success' },
  { label: 'Brouillons', value: jobsStats.value?.draft ?? 0, icon: 'mdi-file-document-edit-outline', color: 'warning' },
  { label: 'Created', value: jobs.value.length, icon: 'mdi-account-tie-outline', color: 'info' },
])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav :items="navItems" />
    </template>

    <section>
      <RecruitPageSection :stats="jobStats">
        <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
          {{ t('platform.recruit.myJobs.alerts.signInRequired') }}
        </v-alert>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
          {{ t('platform.recruit.myJobs.alerts.loadError') }}
        </v-alert>

        <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

        <transition-group name="recruit-list" tag="div">
          <RecruitJobCard
            v-for="job in jobs"
            :key="job.id"
            class="recruit-card--interactive"
            variant="detailed"
            :to="`/platform/${slug}/recruit/job/${job.slug}`"
            :title="job.title"
            :company="job.company"
            :location="job.location"
            :meta="`${job.contractType} · ${job.workMode} · ${job.schedule}`"
            :posted-at="t('platform.recruit.myJobs.createdOn', { date: new Date(job.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') })"
          />
        </transition-group>

        <v-alert v-if="isAuthenticated && !pending && !jobs.length" type="info" variant="tonal">
          {{ t('platform.recruit.myJobs.alerts.empty') }}
        </v-alert>
      </RecruitPageSection>
    </section>
  </PlatformSplitLayout>
</template>
