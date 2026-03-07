<script setup lang="ts">
import UiAside from '~/components/ui/layout/UiAside.vue'
</script>

<template>
  <div class="platform-split-layout">
    <UiAside class="platform-split-layout__sidebar">
      <slot name="sidebar" />
    </UiAside>

    <section class="platform-split-layout__content">
      <article class="platform-split-layout__card">
        <slot />
      </article>
    </section>
  </div>
</template>
<style scoped>
.platform-split-layout {
  padding: 1.5rem;
}
</style>
