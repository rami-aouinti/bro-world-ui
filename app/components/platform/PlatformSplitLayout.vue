<script setup lang="ts">
import AppSplitShell from '~/components/layout/AppSplitShell.vue'
</script>

<template>
  <AppSplitShell>
    <template #left>
      <slot name="sidebar" />
    </template>

    <slot />
  </AppSplitShell>
</template>
