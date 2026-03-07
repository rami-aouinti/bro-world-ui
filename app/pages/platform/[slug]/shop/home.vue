<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { shopCategories, shopProducts } from '~/data/platform/shop'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const shopPath = (page: string) => `/platform/${slug.value}/shop/${page}`
const { isOwner } = usePlatformApplication(slug)
const loading = ref(true)

const categories = computed(() =>
  shopCategories.map(category => ({
    ...category,
    productsCount: shopProducts.filter(product => product.category === category.slug).length,
  })),
)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 220)
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="shopPath('home')">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="shopPath('orders')">Orders</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="shopPath('checkout')">Checkout</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="shopPath('admin')">Admin</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Catalogue produits" subtitle="Parcourir les catégories disponibles" />
      <UiSkeletonCardGrid v-if="loading" :cards="3" />
      <v-row v-else>
        <v-col v-for="category in categories" :key="category.id" cols="12" md="4">
          <EntityCard
            :title="category.title"
            :subtitle="`${category.productsCount} produits`"
            :category="category.slug"
            :status="category.status"
            :tags="category.tags"
            date-label="Mis à jour"
            :date-value="category.updatedAt"
            :to="`/platform/${slug}/shop/${category.slug}/products`"
          />
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
