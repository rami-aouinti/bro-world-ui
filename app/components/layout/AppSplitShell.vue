<script setup lang="ts">
const props = withDefaults(defineProps<{
  leftStickyTop?: string
  leftHeight?: string
}>(), {
  leftStickyTop: '100px',
  leftHeight: 'calc(100vh - 130px)',
})
</script>

<template>
  <div class="app-split-shell">
    <v-card class="app-split-shell__left" rounded="xl" variant="flat">
      <div class="app-split-shell__left-content" :style="{ '--split-sticky-top': props.leftStickyTop, '--split-left-height': props.leftHeight }">
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

<style scoped>
.app-split-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: var(--platform-space-4);
  padding: var(--platform-space-5);
  align-items: start;
}

.app-split-shell__left,
.app-split-shell__right {
  border: 1px solid var(--platform-color-border);
  background: var(--platform-color-surface);
  box-shadow: var(--platform-shadow-sm);
}

.app-split-shell__left-content {
  position: sticky;
  top: var(--split-sticky-top);
  height: var(--split-left-height);
  overflow-y: auto;
  padding: var(--platform-space-4);
}

.app-split-shell__right-content {
  min-height: 76vh;
  overflow-y: auto;
  padding: var(--platform-space-5);
}

@media (max-width: 1120px) {
  .app-split-shell {
    grid-template-columns: 1fr;
  }

  .app-split-shell__left-content {
    position: static;
    height: auto;
    max-height: none;
  }
}
</style>
