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
const jobs = computed(() => data.value?.createdJobs ?? [])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.recruit.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" />
    </template>

    <section>
      <PlatformHeroHeader
        title="platform.recruit.hero.myJobs.title"
        subtitle="platform.recruit.hero.myJobs.subtitle"
        cta="platform.recruit.hero.myJobs.cta"
      />

      <v-alert v-if="!isAuthenticated" type="info" variant="tonal" class="mb-4">
        {{ t('platform.recruit.myJobs.alerts.signInRequired') }}
      </v-alert>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ t('platform.recruit.myJobs.alerts.loadError') }}
      </v-alert>

      <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

      <v-card
        v-for="job in jobs"
        :key="job.id"
        rounded="xl"
        class="mb-4 border"
        hover
        :to="`/platform/${slug}/recruit/job/${job.slug}`"
      >
        <v-card-text class="pa-6">
          <h2 class="text-h5 font-weight-bold mb-2">{{ job.title }}</h2>
          <p class="text-body-1 mb-2">{{ job.company }} · {{ job.location }}</p>
          <p class="text-body-2 text-medium-emphasis mb-1">{{ job.contractType }} · {{ job.workMode }} · {{ job.schedule }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ t('platform.recruit.myJobs.createdOn', { date: new Date(job.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') }) }}</p>
        </v-card-text>
      </v-card>

      <v-alert v-if="isAuthenticated && !pending && !jobs.length" type="info" variant="tonal">
        {{ t('platform.recruit.myJobs.alerts.empty') }}
      </v-alert>
    </section>
  </PlatformSplitLayout>
</template>
