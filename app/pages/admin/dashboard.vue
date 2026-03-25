<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import AdminStatisticsChart from '~/components/admin/AdminStatisticsChart.vue'
import { useStatisticsApi } from '~/composables/api/useStatisticsApi'
import type { AdminStatisticsResponse } from '~/types/api/statistics'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
  skeleton: 'dashboard',
})

const { t } = useI18n()
const statisticsApi = useStatisticsApi()
const loading = ref(true)
const errorMessage = ref('')
const dashboardStats = ref<AdminStatisticsResponse | null>(null)
const cacheStats = ref<CacheStatsResponse | null>(null)

interface CacheResourceStats {
  resource: string
  hit: number
  miss: number
  hitRate: number
  missRate: number
  invalidations: number
  redisLatencyMs: {
    read: number
    write: number
    invalidate: number
  }
}

interface CacheStatsResponse {
  generatedAt: string
  resources: CacheResourceStats[]
  alerts: Array<Record<string, unknown>>
}

const mockDashboardStats: AdminStatisticsResponse = {
  users: { total: 2841, thisWeek: 64, thisMonth: 218, thisYear: 1430 },
  applications: {
    total: 132,
    byPlatform: [
      { name: 'School', applicationCount: 45 },
      { name: 'Shop', applicationCount: 38 },
      { name: 'CRM', applicationCount: 29 },
      { name: 'Recruit', applicationCount: 20 },
    ],
  },
  plugins: {
    total: 67,
    usage: [
      { name: 'Payment Gateway', usageCount: 198 },
      { name: 'Mail Automation', usageCount: 166 },
      { name: 'Analytics Plus', usageCount: 120 },
      { name: 'Loyalty Toolkit', usageCount: 89 },
    ],
  },
  posts: { total: 418, last7Days: 34, thisMonth: 97, thisYear: 351 },
}

const recentActivities = computed(() => ([
  { title: t('admin.dashboard.recent.newPlugin'), actor: 'Product Team', time: '12 min ago', color: 'success' },
  { title: t('admin.dashboard.recent.rolesUpdated'), actor: 'Ops Security', time: '35 min ago', color: 'info' },
  { title: t('admin.dashboard.recent.trafficSpike'), actor: 'Monitoring', time: '1h ago', color: 'warning' },
  { title: t('admin.dashboard.recent.backupDone'), actor: 'Infra', time: '2h ago', color: 'primary' },
]))


const operationalHighlights = [
  { label: 'Availability API', value: '99.95%', trend: '+0.12%' },
  { label: 'Average response time', value: '182 ms', trend: '-14 ms' },
  { label: t('admin.dashboard.highlights.openCriticalTickets'), value: '3', trend: '-2' },
]

const statistics = computed(() => {
  if (!dashboardStats.value) {
    return []
  }

  return [
    {
      title: t('admin.dashboard.stats.usersTotal'),
      value: dashboardStats.value.users.total,
      icon: 'mdi-account-group-outline',
      color: 'primary',
    },
    {
      title: t('admin.dashboard.stats.applicationsTotal'),
      value: dashboardStats.value.applications.total,
      icon: 'mdi-apps',
      color: 'success',
    },
    {
      title: t('admin.dashboard.stats.pluginsTotal'),
      value: dashboardStats.value.plugins.total,
      icon: 'mdi-puzzle-outline',
      color: 'info',
    },
    {
      title: t('admin.dashboard.stats.postsTotal'),
      value: dashboardStats.value.posts.total,
      icon: 'mdi-post-outline',
      color: 'warning',
    },
  ]
})

const growthStats = computed(() => {
  if (!dashboardStats.value) {
    return []
  }

  return [
    {
      title: t('admin.dashboard.stats.usersThisWeek'),
      value: dashboardStats.value.users.thisWeek ?? 0,
      icon: 'mdi-calendar-week',
      color: 'primary',
    },
    {
      title: t('admin.dashboard.stats.usersThisMonth'),
      value: dashboardStats.value.users.thisMonth ?? 0,
      icon: 'mdi-calendar-month-outline',
      color: 'primary',
    },
    {
      title: t('admin.dashboard.stats.postsLast7Days'),
      value: dashboardStats.value.posts.last7Days ?? 0,
      icon: 'mdi-calendar-clock-outline',
      color: 'warning',
    },
    {
      title: t('admin.dashboard.stats.postsThisMonth'),
      value: dashboardStats.value.posts.thisMonth ?? 0,
      icon: 'mdi-calendar-range-outline',
      color: 'warning',
    },
  ]
})

const fetchCacheStats = async () => {
  try {
    cacheStats.value = await $fetch<CacheStatsResponse>('/api/admin/cache/stats')
  }
  catch {
    cacheStats.value = null
  }
}

const fetchStatistics = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const [statisticsResponse] = await Promise.all([
      statisticsApi.getAdminStatistics(),
      fetchCacheStats(),
    ])

    dashboardStats.value = statisticsResponse
  }
  catch {
    dashboardStats.value = mockDashboardStats
    errorMessage.value = `${t('admin.dashboard.errors.load')} — Displaying demo data.`
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchStatistics()
})
</script>

<template>
  <div class="admin-page-content">
    <UiSectionHeader
      :title="t('admin.dashboard.title')"
      :subtitle="t('admin.dashboard.description')"
    />

    <v-alert v-if="errorMessage" type="warning" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <template v-if="loading">
      <v-row class="mb-1">
        <v-col cols="12" lg="8">
          <UiCard rounded="lg">
            <v-skeleton-loader type="heading, text, list-item-two-line@3" />
          </UiCard>
        </v-col>

        <v-col cols="12" lg="4">
          <UiCard rounded="lg" class="h-100">
            <v-skeleton-loader type="heading, list-item-three-line@4" />
          </UiCard>
        </v-col>
      </v-row>

      <v-row class="mb-1">
        <v-col v-for="index in 4" :key="`stats-skeleton-${index}`" cols="12" md="6" lg="3">
          <UiCard rounded="lg">
            <v-skeleton-loader type="list-item-avatar-two-line" />
          </UiCard>
        </v-col>
      </v-row>
    </template>

    <template v-else>
    <v-row class="mb-1">
      <v-col cols="12" lg="8">
        <UiCard rounded="lg">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-h6">{{ t('admin.dashboard.operational.title') }}</div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ t('admin.dashboard.operational.subtitle') }}</p>
            </div>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="fetchStatistics">
              {{ t('admin.dashboard.refresh') }}
            </v-btn>
          </div>

          <v-row>
            <v-col v-for="highlight in operationalHighlights" :key="highlight.label" cols="12" md="4">
              <div class="admin-highlight-card">
                <p class="text-caption text-medium-emphasis mb-1">{{ highlight.label }}</p>
                <div class="d-flex align-end justify-space-between">
                  <div class="text-h5 font-weight-bold">{{ highlight.value }}</div>
                  <v-chip size="small" color="success" variant="tonal">{{ highlight.trend }}</v-chip>
                </div>
              </div>
            </v-col>
          </v-row>
        </UiCard>
      </v-col>

      <v-col cols="12" lg="4">
        <UiCard rounded="lg" class="h-100">
          <div class="text-h6 mb-3">{{ t('admin.dashboard.recent.title') }}</div>
          <v-timeline density="compact" side="end" truncate-line="both">
            <v-timeline-item
              v-for="activity in recentActivities"
              :key="activity.title"
              :dot-color="activity.color"
              size="small"
            >
              <div class="text-body-2 font-weight-medium">{{ activity.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ activity.actor }} • {{ activity.time }}</div>
            </v-timeline-item>
          </v-timeline>
        </UiCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="item in statistics"
        :key="item.title"
        cols="12"
        md="6"
        lg="3"
      >
        <UiCard rounded="lg" compact>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 text-medium-emphasis">{{ item.title }}</span>
            <v-icon :icon="item.icon" :color="item.color" />
          </div>
          <div class="text-h4 font-weight-bold">{{ item.value }}</div>
        </UiCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="item in growthStats"
        :key="item.title"
        cols="12"
        md="6"
        lg="3"
      >
        <UiCard rounded="lg" compact>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 text-medium-emphasis">{{ item.title }}</span>
            <v-icon :icon="item.icon" :color="item.color" />
          </div>
          <div class="text-h5 font-weight-bold">{{ item.value }}</div>
        </UiCard>
      </v-col>
    </v-row>


    <v-row class="mt-2">
      <v-col cols="12">
        <UiCard rounded="lg">
          <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
            <div>
              <div class="text-h6">Cache observability</div>
              <p class="text-body-2 text-medium-emphasis mb-0">Hit/miss rates, invalidations, and Redis latency by endpoint family.</p>
            </div>
            <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchCacheStats">Refresh cache stats</v-btn>
          </div>

          <v-alert
            v-if="cacheStats?.alerts?.length"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-medium">Active cache alerts</div>
            <ul class="pl-5 mb-0">
              <li v-for="(alert, index) in cacheStats.alerts" :key="`cache-alert-${index}`">
                {{ JSON.stringify(alert) }}
              </li>
            </ul>
          </v-alert>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Resource</th>
                <th class="text-right">Hit rate</th>
                <th class="text-right">Miss rate</th>
                <th class="text-right">Invalidations</th>
                <th class="text-right">Redis read (ms)</th>
                <th class="text-right">Redis write (ms)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="resource in cacheStats?.resources ?? []" :key="resource.resource">
                <td class="text-capitalize">{{ resource.resource }}</td>
                <td class="text-right">{{ resource.hitRate.toFixed(2) }}%</td>
                <td class="text-right">{{ resource.missRate.toFixed(2) }}%</td>
                <td class="text-right">{{ resource.invalidations }}</td>
                <td class="text-right">{{ resource.redisLatencyMs.read.toFixed(2) }}</td>
                <td class="text-right">{{ resource.redisLatencyMs.write.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
        </UiCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <UiCard rounded="lg">
          <div class="text-h6 mb-4">{{ t('admin.dashboard.charts.title') }}</div>
          <AdminStatisticsChart :statistics="dashboardStats" />
        </UiCard>
      </v-col>
    </v-row>
      </template>
  </div>
</template>

<style scoped>
.admin-highlight-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 14px;
  padding: 14px;
}
</style>
