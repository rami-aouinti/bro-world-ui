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

const fetchStatistics = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    dashboardStats.value = await statisticsApi.getAdminStatistics()
  }
  catch {
    errorMessage.value = t('admin.dashboard.errors.load')
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

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

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

    <v-row>
      <v-col cols="12">
        <UiCard rounded="lg">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-h6">{{ t('admin.dashboard.charts.title') }}</div>
            <v-btn size="small" variant="text" :loading="loading" @click="fetchStatistics">
              {{ t('admin.dashboard.refresh') }}
            </v-btn>
          </div>
          <AdminStatisticsChart :statistics="dashboardStats" />
        </UiCard>
      </v-col>
    </v-row>
  </div>
</template>
