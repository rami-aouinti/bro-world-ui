<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
</script>

<template>
  <div class="platform-split-layout">
    <aside class="platform-split-layout__sidebar">
      <article class="platform-split-layout__card platform-split-layout__card--sidebar">
        <slot name="sidebar" />
      </article>
    </aside>

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