<script setup lang="ts">
import type { AdminStatisticsResponse } from '~/types/api/statistics'
import { useLazyExternalLibs } from '~/composables/useLazyExternalLibs'

type ECharts = import('echarts').ECharts
type EChartsOption = import('echarts').EChartsOption

const props = defineProps<{
  statistics: AdminStatisticsResponse | null
}>()

const { t } = useI18n()
const { loadECharts, isLoading: isChartLibLoading } = useLazyExternalLibs()
const chartContainer = ref<HTMLElement | null>(null)
const chartInstance = ref<ECharts | null>(null)

const option = computed<EChartsOption>(() => {
  const byPlatform = props.statistics?.applications.byPlatform ?? []
  const pluginUsage = props.statistics?.plugins.usage ?? []

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: { data: [t('admin.dashboard.charts.applicationsByPlatform'), t('admin.dashboard.charts.pluginsUsage')], top: 0 },
    grid: {
      left: '3%', right: '4%', containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { alignWithLabel: true },
        data: byPlatform.map(item => item.name),
      },
      {
        type: 'category',
        axisTick: { alignWithLabel: true },
        data: pluginUsage.map(item => item.name),
      },
    ],
    yAxis: [
      { type: 'value', name: t('admin.dashboard.charts.countLabel') },
      { type: 'value', name: t('admin.dashboard.charts.countLabel') },
    ],
    series: [
      {
        name: t('admin.dashboard.charts.applicationsByPlatform'),
        type: 'bar',
        data: byPlatform.map(item => item.applicationCount ?? 0),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
      {
        name: t('admin.dashboard.charts.pluginsUsage'),
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: pluginUsage.map(item => item.usageCount ?? 0),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
  }
})

const resizeChart = () => {
  chartInstance.value?.resize()
}

watch(option, (newOption) => {
  if (!chartInstance.value)
    return

  chartInstance.value.setOption(newOption, true)
})

onMounted(async () => {
  if (!chartContainer.value)
    return

  const echarts = await loadECharts()
  chartInstance.value = echarts.init(chartContainer.value)
  chartInstance.value.setOption(option.value)
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance.value?.dispose()
  chartInstance.value = null
})
</script>

<template>
  <div>
    <v-skeleton-loader
      v-if="isChartLibLoading && !chartInstance"
      type="image"
      height="360"
      class="admin-statistics-chart__skeleton"
    />
    <div v-show="!isChartLibLoading || chartInstance" ref="chartContainer" class="admin-statistics-chart" />
  </div>
</template>

<style scoped>
.admin-statistics-chart {
  width: 100%;
  min-height: 360px;
}
</style>
