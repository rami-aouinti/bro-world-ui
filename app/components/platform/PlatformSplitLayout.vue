<script setup lang="ts">
import PlatformDomainSidebar from '~/components/platform/PlatformDomainSidebar.vue'
import UiAside from '~/components/ui/layout/UiAside.vue'

const route = useRoute()

const currentDomain = computed(() => {
  const domain = String(route.params.domain ?? '')
  if (['crm', 'shop', 'recruit', 'school'].includes(domain)) {
    return domain as 'crm' | 'shop' | 'recruit' | 'school'
  }

  const matched = route.path.match(/^\/platform\/[^/]+\/(crm|shop|recruit|school)\b/)
  return (matched?.[1] as 'crm' | 'shop' | 'recruit' | 'school' | undefined) ?? null
})

const currentSlug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <div class="platform-split-layout">
    <UiAside class="platform-split-layout__sidebar">
      <PlatformDomainSidebar
        v-if="currentDomain && currentSlug"
        :domain="currentDomain"
        :slug="currentSlug"
      />
      <slot v-else name="sidebar" />
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
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
  gap: 1.25rem;
  padding: 1.5rem;
}

@media (max-width: 960px) {
  .platform-split-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
</style>
