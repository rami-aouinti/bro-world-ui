<template>
  <div class="app-split-shell">
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
