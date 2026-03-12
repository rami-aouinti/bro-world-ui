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

const recentActivities = [
  { title: 'Nouveau plugin “SMS Campaign” publié', actor: 'Equipe Produit', time: 'Il y a 12 min', color: 'success' },
  { title: 'Mise à jour des rôles administrateurs', actor: 'Ops Security', time: 'Il y a 35 min', color: 'info' },
  { title: 'Pic de trafic détecté sur le portail School', actor: 'Monitoring', time: 'Il y a 1h', color: 'warning' },
  { title: 'Sauvegarde hebdomadaire terminée', actor: 'Infra', time: 'Il y a 2h', color: 'primary' },
]

const operationalHighlights = [
  { label: 'Disponibilité API', value: '99.95%', trend: '+0.12%' },
  { label: 'Temps moyen de réponse', value: '182 ms', trend: '-14 ms' },
  { label: 'Tickets critiques ouverts', value: '3', trend: '-2' },
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

const fetchStatistics = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    dashboardStats.value = await statisticsApi.getAdminStatistics()
  }
  catch {
    dashboardStats.value = mockDashboardStats
    errorMessage.value = `${t('admin.dashboard.errors.load')} — Affichage des données de démonstration.`
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
              <div class="text-h6">Vue opérationnelle</div>
              <p class="text-body-2 text-medium-emphasis mb-0">Indicateurs clés de l'activité admin en temps réel.</p>
            </div>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="fetchStatistics">
              Actualiser les données
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
          <div class="text-h6 mb-3">Activités récentes</div>
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
