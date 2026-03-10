<template>
  <v-card class="ui-list-card pa-4 pa-md-5 rounded-xl h-100" elevation="1">
    <slot />
  </v-card>
</template>

<style scoped>
.ui-list-card {
  transition:
    border-color var(--motion-fast) var(--easing-standard),
    box-shadow var(--motion-base) var(--easing-standard),
    transform var(--motion-base) var(--easing-emphasized);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.ui-list-card:hover,
.ui-list-card:focus-within {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.08);
}
</style>
