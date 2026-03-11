<script setup lang="ts">
import type { NavItem } from '~/data/platform-demo'

const props = defineProps<{
  title: string
  slug: string
  navItems: NavItem[]
  subtitle?: string
  subtitleValues?: Record<string, string | number>
}>()
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        :title="props.title"
        :subtitle="props.subtitle ?? 'platform.common.sidebar.application'"
        :subtitle-values="props.subtitleValues ?? { slug: props.slug }"
        :items="props.navItems"
      />
    </template>

    <section>
      <slot />
    </section>
  </PlatformSplitLayout>
</template>
