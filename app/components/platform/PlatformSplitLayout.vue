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
  gap: var(--platform-space-4);
  padding: var(--platform-space-5);
}

.platform-split-layout__sidebar {
  position: sticky;
  top: var(--platform-space-5);
  align-self: flex-start;
  max-height: calc(100vh - 2.5rem);
  overflow: auto;
  border: 1px solid var(--platform-color-border);
  border-radius: var(--platform-radius-lg);
  background: linear-gradient(
    180deg,
    var(--platform-color-accent-soft),
    var(--platform-color-surface-muted)
  );
  box-shadow: var(--platform-shadow-sm);
}

.platform-split-layout__card {
  border: 1px solid var(--platform-color-border);
  border-radius: var(--platform-radius-lg);
  min-height: 76vh;
  padding: var(--platform-space-5);
  background: var(--platform-color-surface);
  box-shadow: var(--platform-shadow-sm);
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
