<template>
  <v-card class="ui-list-card pa-4 pa-md-5 h-100" rounded="2xl" elevation="1">
    <slot />
  </v-card>
</template>

<style scoped>
.ui-list-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.ui-list-card:hover,
.ui-list-card:focus-within {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.08);
}
</style>
