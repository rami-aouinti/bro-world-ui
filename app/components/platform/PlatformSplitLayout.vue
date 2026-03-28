<script setup lang="ts">
import AppSplitShell from '~/components/layout/AppSplitShell.vue'
</script>

<template>
  <AppSplitShell>
    <template #left>
      <slot name="sidebar" />
    </template>

    <slot />

    <template v-if="$slots.aside" #aside>
      <slot name="aside" />
    </template>
  </AppSplitShell>
</template>
<style scoped>
.title-chip {
  color: rgba(var(--v-theme-on-surface), 0.95) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.28) !important;
  background-color: rgba(var(--v-theme-surface), 0.9) !important;
}
</style>
