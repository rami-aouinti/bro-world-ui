<script setup lang="ts">
const props = withDefaults(defineProps<{
  leftStickyTop?: string
  leftHeight?: string
}>(), {
  leftStickyTop: 'calc(var(--app-split-shell-appbar-height) + var(--app-split-shell-margin))',
  leftHeight: 'calc(100vh - var(--app-split-shell-appbar-height) - (var(--app-split-shell-margin) * 2))',
})
</script>

<template>
  <div
    class="app-split-shell"
    :style="{ '--split-sticky-top': props.leftStickyTop, '--split-left-height': props.leftHeight }"
  >
    <v-card class="app-split-shell__left" rounded="xl" variant="flat">
      <div class="app-split-shell__left-content">
        <slot name="left" />
      </div>
    </v-card>

    <v-card class="app-split-shell__right" rounded="xl" variant="flat">
      <div class="app-split-shell__right-content">
        <slot />
      </div>
    </v-card>
  </div>
</template>
