<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const category = computed(() => String(route.params.category ?? ''))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${slug}/shop/home`">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="`/platform/${slug}/shop/orders`">Orders</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader :title="`Produits · ${category}`" subtitle="Listing de la catégorie" />
      <UiCard>
        <v-list lines="two">
          <v-list-item title="Starter pack" subtitle="SKU-001 · 29 €" :to="`/platform/${slug}/shop/${category}/product/starter-pack`" />
          <v-list-item title="Pro bundle" subtitle="SKU-002 · 79 €" :to="`/platform/${slug}/shop/${category}/product/pro-bundle`" />
          <v-list-item title="Enterprise kit" subtitle="SKU-003 · 149 €" :to="`/platform/${slug}/shop/${category}/product/enterprise-kit`" />
        </v-list>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
