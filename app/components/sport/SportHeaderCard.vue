<script setup lang="ts">
interface SportMetric {
  label: string
  value: string
}

defineProps<{
  sportName: string
  sportIcon: string
  metrics: SportMetric[]
}>()

const { t } = useI18n()
</script>

<template>
  <v-card variant="tonal" class="pa-4 pa-md-6">
    <div class="d-flex flex-column flex-md-row ga-4 align-start align-md-center justify-space-between">
      <div class="d-flex align-center ga-3">
        <v-avatar size="56" color="primary" variant="tonal">
          <v-icon :icon="sportIcon" size="28" />
        </v-avatar>
        <div>
          <h2 class="text-h5 font-weight-bold mb-1">
            {{ sportName }}
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ t('sport.overviewDashboard') }}
          </p>
        </div>
      </div>

      <div class="d-flex flex-wrap ga-3">
        <v-chip
          v-for="metric in metrics"
          :key="metric.label"
          color="primary"
          variant="outlined"
          class="font-weight-medium"
        >
          <span class="me-1">{{ metric.label }}:</span>{{ metric.value }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>
