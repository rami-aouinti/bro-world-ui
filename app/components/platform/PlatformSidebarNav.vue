<script setup lang="ts">
import type { NavItem } from '~/data/platform-demo'

const { t, te } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isAuthenticated } = useAuth()
const { application, resolveApplication } = usePlatformApplication(slug)

const props = defineProps<{
  title: string
  subtitle?: string
  subtitleValues?: Record<string, string | number>
  items: NavItem[]
}>()

const resolveLabel = (value?: string) => {
  if (!value) return ''
  return te(value) ? t(value) : value
}

const hasCalendarPlugin = computed(() => application.value?.pluginKeys?.includes('calendar') === true)

const navItems = computed<NavItem[]>(() => {
  const withoutCalendarEntries = props.items.filter(item => !item.to.endsWith('/calendar'))

  if (!hasCalendarPlugin.value || !slug.value) {
    return withoutCalendarEntries
  }

  return [
    ...withoutCalendarEntries,
    {
      title: 'Calendar',
      icon: 'mdi-calendar-month-outline',
      to: `/platform/${slug.value}/calendar`,
    },
  ]
})

onMounted(async () => {
  if (!slug.value || application.value) {
    return
  }

  await resolveApplication()
})

watch(isAuthenticated, async () => {
  if (!slug.value) {
    return
  }

  await resolveApplication()
})
</script>

<template>
  <div class="platform-sidebar-nav">
    <v-list nav density="compact" rounded="xl" class="platform-sidebar-nav__list">
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        rounded="lg"
        :prepend-icon="item.icon"
        :title="resolveLabel(item.title)"
        :subtitle="resolveLabel(item.subtitle)"
        color="primary"
      />
    </v-list>
    <slot />
  </div>
</template>

<style scoped>
.platform-sidebar-nav__list {
  background: transparent;
}
</style>
