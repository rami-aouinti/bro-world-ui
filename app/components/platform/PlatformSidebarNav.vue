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
    <div class="mb-4">
      <h3 class="text-h6 mb-1">{{ resolveLabel(props.title) }}</h3>
      <p v-if="props.subtitle" class="text-body-2 text-medium-emphasis">{{ te(props.subtitle) ? t(props.subtitle, props.subtitleValues) : props.subtitle }}</p>
    </div>

    <v-list nav density="comfortable" rounded="xl" class="platform-sidebar-nav__list">
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

    <v-divider class="my-4" />
    <v-btn block variant="text" to="/platform" prepend-icon="mdi-arrow-left">{{ t('platform.common.backToList') }}</v-btn>
  </div>
</template>

<style scoped>
.platform-sidebar-nav__list {
  background: rgba(127, 127, 127, 0.05);
}
</style>
