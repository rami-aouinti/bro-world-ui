<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { getRecruitNav } from '~/data/platform-nav'

type AppliedJobItem = {
  applicationId: string
  status: string
  appliedAt: string
  job: {
    id: string
    slug: string
    title: string
    company: string
    location: string
    contractType: string
    workMode: string
    schedule: string
  }
}

type RecruitMeJobsResponse = {
  appliedJobs?: AppliedJobItem[]
}

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { apiFetch } = useApiClient()
const { initSession, isAuthenticated } = useAuth()

const navItems = computed(() => getRecruitNav(slug.value, isOwner.value, isAuthenticated.value))

const { data, pending, error } = await useAsyncData(
  () => `recruit-my-applications-${slug.value}`,
  async () => {
    await initSession()

    if (!isAuthenticated.value) {
      return []
    }

    const response = await apiFetch<RecruitMeJobsResponse>('/api/v1/recruit/private/me/jobs', { method: 'GET' })
    return response.appliedJobs ?? []
  },
  { watch: [slug], default: () => [] },
)
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
        Connectez-vous pour consulter vos candidatures.
      </v-alert>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        Impossible de charger vos candidatures pour le moment.
      </v-alert>

      <v-skeleton-loader v-if="pending" type="article" class="mb-4" />

      <v-card
        v-for="application in data"
        :key="application.applicationId"
        rounded="xl"
        class="mb-4 border"
        hover
        :to="`/platform/${slug}/recruit/job/${application.job.slug}`"
      >
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <h2 class="text-h5 font-weight-bold">{{ application.job.title }}</h2>
            <v-chip size="small" color="primary" variant="tonal">{{ application.status }}</v-chip>
          </div>
          <p class="text-body-1 mb-2">{{ application.job.company }} · {{ application.job.location }}</p>
          <p class="text-body-2 text-medium-emphasis mb-1">{{ application.job.contractType }} · {{ application.job.workMode }} · {{ application.job.schedule }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">Candidature envoyée le {{ new Date(application.appliedAt).toLocaleDateString('fr-FR') }}</p>
        </v-card-text>
      </v-card>

      <v-alert v-if="isAuthenticated && !pending && !data.length" type="info" variant="tonal">
        Vous n'avez encore postulé à aucune offre.
      </v-alert>
    </section>
  </PlatformSplitLayout>
</template>
