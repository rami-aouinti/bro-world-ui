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
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 1rem;
  padding: 1.25rem;
}

.platform-split-layout__sidebar {
  position: sticky;
  top: 1.25rem;
  align-self: flex-start;
  max-height: calc(100vh - 2.5rem);
  overflow: auto;
  border: 1px solid rgba(127, 127, 127, 0.18);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(103, 58, 183, 0.08), rgba(33, 150, 243, 0.04));
}

.platform-split-layout__card {
  border: 1px solid rgba(127, 127, 127, 0.15);
  border-radius: 20px;
  min-height: 76vh;
  padding: 1.25rem;
  background: var(--v-theme-surface);
  animation: fadeInUp 260ms ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1120px) {
  .platform-split-layout {
    grid-template-columns: 1fr;
  }

  .platform-split-layout__sidebar {
    position: static;
    max-height: none;
  }
}
</style>
