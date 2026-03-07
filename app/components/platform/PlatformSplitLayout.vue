<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
</script>

<template>
  <UiPageSection max-width="1200">
    <div class="platform-split-layout">
      <aside class="platform-split-layout__sidebar">
        <UiPageSection card class="platform-split-layout__sidebar-card">
          <slot name="sidebar" />
        </UiPageSection>
      </aside>

      <section class="platform-split-layout__content">
        <UiPageSection card>
          <slot />
        </UiPageSection>
      </section>
    </div>
  </UiPageSection>
</template>

<style scoped>
.platform-split-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.platform-split-layout__sidebar,
.platform-split-layout__content {
  min-width: 0;
}

.platform-split-layout__sidebar-card {
  position: sticky;
  top: 1rem;
}

@media (max-width: 960px) {
  .platform-split-layout {
    grid-template-columns: 1fr;
  }

  .platform-split-layout__sidebar-card {
    position: static;
  }
}
</style>
