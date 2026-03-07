<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopConversionFunnel from '~/components/platform/sections/ShopConversionFunnel.vue'
import { platformPageSections } from '~/data/platform-demo'
import { shopPaymentSections } from '~/data/platform-enhanced'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const isOwner = computed(() => true)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <ShopConversionFunnel
        :title="platformPageSections.shop.pageTitle"
        :sections-meta="platformPageSections.shop.sections"
        :section-data="shopPaymentSections"
      />
    </section>
  </PlatformSplitLayout>
</template>
