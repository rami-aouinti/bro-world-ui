<script setup lang="ts">
import JobCard from '~/components/platform/cards/JobCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { recruitJobs } from '~/data/platform/recruit'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformApplication(slug)

const loading = ref(true)
const visibleCount = ref(6)
const selectedStatus = ref<'all' | 'open' | 'paused' | 'closed' | 'draft'>('all')

const sortedJobs = computed(() =>
  [...recruitJobs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
)

const filteredJobs = computed(() => {
  if (selectedStatus.value === 'all') return sortedJobs.value
  return sortedJobs.value.filter(job => job.status === selectedStatus.value)
})

const visibleJobs = computed(() => filteredJobs.value.slice(0, visibleCount.value))
const canLoadMore = computed(() => visibleCount.value < filteredJobs.value.length)

const loadMore = () => {
  visibleCount.value += 6
}

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 280)
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Recruit" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${slug}/recruit/home`">Jobs</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="`/platform/${slug}/recruit/admin`">Admin</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Offres d'emploi" subtitle="Pipeline de recrutement" />

      <div class="d-flex align-center ga-2 mb-4 flex-wrap">
        <v-chip
          v-for="status in ['all', 'open', 'paused', 'closed', 'draft']"
          :key="status"
          :variant="selectedStatus === status ? 'flat' : 'outlined'"
          color="primary"
          @click="selectedStatus = status"
        >
          {{ status }}
        </v-chip>
      </div>

      <UiSkeletonCardGrid v-if="loading" :cards="6" />

      <v-fade-transition group>
        <v-row v-if="!loading" key="jobs-grid">
          <v-col v-for="job in visibleJobs" :key="job.id" cols="12" md="6" lg="4">
            <JobCard :job="job" :to="`/platform/${slug}/recruit/job/${job.slug}`" />
          </v-col>
        </v-row>
      </v-fade-transition>

      <div v-if="!loading && canLoadMore" class="mt-4 d-flex justify-center">
        <v-btn variant="tonal" color="primary" @click="loadMore">Charger plus</v-btn>
      </div>
    </template>
  </PlatformSplitLayout>
</template>
