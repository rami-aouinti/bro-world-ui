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
