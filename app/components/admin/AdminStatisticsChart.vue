<script setup lang="ts">
import type { ECharts, EChartsOption } from 'echarts'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { init, use } from 'echarts/core'

use([TitleComponent, TooltipComponent, LegendComponent, GridComponent, LineChart, BarChart, CanvasRenderer])

const { t } = useI18n()
const chartContainer = ref<HTMLElement | null>(null)
const chartInstance = ref<ECharts | null>(null)

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: [t('admin.dashboard.charts.users'), t('admin.dashboard.charts.apiRequests')],
    top: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [
      t('admin.dashboard.charts.days.mon'),
      t('admin.dashboard.charts.days.tue'),
      t('admin.dashboard.charts.days.wed'),
      t('admin.dashboard.charts.days.thu'),
      t('admin.dashboard.charts.days.fri'),
      t('admin.dashboard.charts.days.sat'),
      t('admin.dashboard.charts.days.sun'),
    ],
  },
  yAxis: [
    {
      type: 'value',
      name: t('admin.dashboard.charts.users'),
    },
    {
      type: 'value',
      name: t('admin.dashboard.charts.apiRequests'),
    },
  ],
  series: [
    {
      name: t('admin.dashboard.charts.users'),
      type: 'line',
      smooth: true,
      data: [920, 1010, 970, 1100, 1248, 1180, 1212],
    },
    {
      name: t('admin.dashboard.charts.apiRequests'),
      type: 'bar',
      yAxisIndex: 1,
      data: [4800, 5200, 4950, 5500, 56320, 5340, 5100],
    },
  ],
}))

const resizeChart = () => {
  chartInstance.value?.resize()
}

watch(option, (newOption) => {
  if (!chartInstance.value)
    return

  chartInstance.value.setOption(newOption)
})

onMounted(() => {
  if (!chartContainer.value)
    return

  chartInstance.value = init(chartContainer.value)
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
    <div ref="chartContainer" class="admin-statistics-chart" />
  </div>
</template>

<style scoped>
.admin-statistics-chart {
  width: 100%;
  min-height: 360px;
}
</style>
