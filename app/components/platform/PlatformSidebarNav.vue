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

const ALLOWED_PLUGINS = [
  { key: 'chat', title: 'Chat', icon: 'mdi-chat-outline' },
  { key: 'calendar', title: 'Calendar', icon: 'mdi-calendar-month-outline' },
  { key: 'quiz', title: 'Quiz', icon: 'mdi-help-circle-outline' },
  { key: 'blog', title: 'Blog', icon: 'mdi-post-outline' },
] as const

const ALLOWED_PLUGIN_KEYS = new Set(ALLOWED_PLUGINS.map(plugin => plugin.key))

const normalizedPlatformKey = computed(() => {
  const platformFromApplication = application.value?.platformKey?.toLowerCase().trim()

  if (platformFromApplication) {
    return platformFromApplication
  }

  const [, , , segment] = route.path.split('/')
  return (segment ?? '').toLowerCase().trim()
})

const pluginItems = computed<NavItem[]>(() => {
  const normalized = normalizedPlatformKey.value

  if (!slug.value || !normalized) {
    return []
  }

  const pluginKeys = application.value?.pluginKeys ?? []
  const presentPluginKeys = new Set(pluginKeys.filter(pluginKey => ALLOWED_PLUGIN_KEYS.has(pluginKey)))

  return ALLOWED_PLUGINS
    .filter(plugin => presentPluginKeys.has(plugin.key))
    .map(plugin => ({
      title: plugin.title,
      icon: plugin.icon,
      to: `/platform/${slug.value}/${normalized}/${plugin.key}`,
    }))
})

const navItems = computed<NavItem[]>(() => {
  const filteredBaseItems = props.items.filter((item) => {
    return !ALLOWED_PLUGINS.some(plugin => item.to.endsWith(`/${plugin.key}`))
  })

  return [...filteredBaseItems, ...pluginItems.value]
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
      <template v-for="item in navItems" :key="item.to">
        <v-list-group
          v-if="item.children?.length"
          :value="item.to"
        >
          <template #activator="{ props: activatorProps }">
            <v-list-item
              v-bind="activatorProps"
              rounded="lg"
              :prepend-icon="item.icon"
              :title="resolveLabel(item.title)"
              :subtitle="resolveLabel(item.subtitle)"
              color="primary"
            />
          </template>

          <v-list-item
            v-for="child in item.children"
            :key="child.to"
            :to="child.to"
            rounded="lg"
            :prepend-icon="child.icon"
            :title="resolveLabel(child.title)"
            :subtitle="resolveLabel(child.subtitle)"
            color="primary"
          />
        </v-list-group>

        <v-list-item
          v-else
          :to="item.to"
          rounded="lg"
          :prepend-icon="item.icon"
          :title="resolveLabel(item.title)"
          :subtitle="resolveLabel(item.subtitle)"
          color="primary"
        />
      </template>
    </v-list>
    <slot />
  </div>
</template>

<style scoped>
.platform-sidebar-nav__list {
  background: transparent;
}
</style>
