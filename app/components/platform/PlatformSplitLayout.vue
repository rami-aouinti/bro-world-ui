<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
</script>

<template>
  <UiPageSection max-width="1200">
    <div class="platform-split-layout">
      <aside class="platform-split-layout__sidebar">
        <UiPageSection card class="platform-split-layout__sidebar-card">
          <article class="platform-split-layout__card platform-split-layout__card--sidebar">
            <slot name="sidebar" />
          </article>
        </UiPageSection>
      </aside>

      <section class="platform-split-layout__content">
        <UiPageSection card>
          <article class="platform-split-layout__card">
            <slot />
          </article>
        </UiPageSection>
      </section>
    </div>
  </UiPageSection>
</template>
