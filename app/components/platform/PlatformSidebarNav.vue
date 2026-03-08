<script setup lang="ts">
import type { NavItem } from '~/data/platform-demo'

const { t, te } = useI18n()

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
</script>

<template>
  <div class="platform-sidebar-nav">
    <v-list nav density="compact" rounded="xl" class="platform-sidebar-nav__list">
      <v-list-item
        v-for="item in props.items"
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
