<template>
  <div class="app-split-shell" :class="{ 'app-split-shell--with-aside': Boolean($slots.aside) }">
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

    <v-card v-if="$slots.aside" class="app-split-shell__aside" rounded="xl" variant="flat">
      <div class="app-split-shell__aside-content">
        <slot name="aside" />
      </div>
    </v-card>
  </div>
</template>
