<script setup lang="ts">
import AppSplitShell from '~/components/layout/AppSplitShell.vue'
</script>

<template>
  <AppSplitShell>
    <template #left>
      <slot name="sidebar" />
    </template>

    <slot />

    <template #aside>
      <slot name="aside" />
    </template>
  </AppSplitShell>
</template>
