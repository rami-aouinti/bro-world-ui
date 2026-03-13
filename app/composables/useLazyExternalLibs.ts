import { computed, ref } from 'vue'

type LoaderState = {
  isLoading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<Error | null>>
}

const loaderStates = new Map<string, LoaderState>()
const pendingLoads = new Map<string, Promise<unknown>>()
const resolvedModules = new Map<string, unknown>()

const getLoaderState = (key: string) => {
  const state = loaderStates.get(key)
  if (state)
    return state

  const newState: LoaderState = {
    isLoading: ref(false),
    error: ref<Error | null>(null),
  }

  loaderStates.set(key, newState)
  return newState
}

const runLazyImport = async <T>(key: string, importer: () => Promise<T>) => {
  const state = getLoaderState(key)

  if (resolvedModules.has(key))
    return resolvedModules.get(key) as T

  if (!pendingLoads.has(key)) {
    state.isLoading.value = true
    state.error.value = null

    const task = importer()
      .then((module) => {
        resolvedModules.set(key, module)
        return module
      })
      .catch((error: unknown) => {
        const normalizedError = error instanceof Error ? error : new Error('Failed to load external library')
        state.error.value = normalizedError
        throw normalizedError
      })
      .finally(() => {
        state.isLoading.value = false
        pendingLoads.delete(key)
      })

    pendingLoads.set(key, task)
  }

  return pendingLoads.get(key) as Promise<T>
}

const loadECharts = async () => {
  const [{ init, use }, charts, components, renderers] = await Promise.all([
    runLazyImport('echarts/core', () => import('echarts/core')),
    runLazyImport('echarts/charts', () => import('echarts/charts')),
    runLazyImport('echarts/components', () => import('echarts/components')),
    runLazyImport('echarts/renderers', () => import('echarts/renderers')),
  ])

  use([
    components.TooltipComponent,
    components.LegendComponent,
    components.GridComponent,
    charts.BarChart,
    renderers.CanvasRenderer,
  ])

  return { init }
}

const loadFullCalendar = async () => {
  const [vueCalendar, dayGrid, timeGrid, interaction] = await Promise.all([
    runLazyImport('@fullcalendar/vue3', () => import('@fullcalendar/vue3')),
    runLazyImport('@fullcalendar/daygrid', () => import('@fullcalendar/daygrid')),
    runLazyImport('@fullcalendar/timegrid', () => import('@fullcalendar/timegrid')),
    runLazyImport('@fullcalendar/interaction', () => import('@fullcalendar/interaction')),
  ])

  return {
    FullCalendar: vueCalendar.default,
    plugins: [dayGrid.default, timeGrid.default, interaction.default],
  }
}

const loadXlsx = () => runLazyImport('xlsx', () => import('xlsx'))
const loadJspdf = () => runLazyImport('jspdf', () => import('jspdf'))

export const useLazyExternalLibs = () => {
  const echartsState = getLoaderState('echarts/core')
  const fullCalendarState = getLoaderState('@fullcalendar/vue3')
  const xlsxState = getLoaderState('xlsx')
  const jspdfState = getLoaderState('jspdf')

  const isLoading = computed(() => (
    echartsState.isLoading.value
    || fullCalendarState.isLoading.value
    || xlsxState.isLoading.value
    || jspdfState.isLoading.value
  ))

  const error = computed(() => (
    echartsState.error.value
    || fullCalendarState.error.value
    || xlsxState.error.value
    || jspdfState.error.value
    || null
  ))

  return {
    isLoading,
    error,
    loadECharts,
    loadFullCalendar,
    loadXlsx,
    loadJspdf,
  }
}
