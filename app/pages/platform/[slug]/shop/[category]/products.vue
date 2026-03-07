<script setup lang="ts">
import ProductCard from '~/components/platform/cards/ProductCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { shopProducts, type ShopProductStatus } from '~/data/platform/shop'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const category = computed(() => String(route.params.category ?? ''))

const loading = ref(true)
const visibleCount = ref(6)
const statusFilter = ref<'all' | ShopProductStatus>('all')

const productsByCategory = computed(() =>
  shopProducts
    .filter(product => product.category === category.value)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
)

const filteredProducts = computed(() => {
  if (statusFilter.value === 'all') return productsByCategory.value
  return productsByCategory.value.filter(product => product.status === statusFilter.value)
})

const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value))
const canLoadMore = computed(() => visibleCount.value < filteredProducts.value.length)

const loadMore = () => {
  visibleCount.value += 6
}

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 260)
})
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

      <div class="d-flex align-center ga-2 mb-4 flex-wrap">
        <v-chip
          v-for="status in ['all', 'active', 'draft', 'out-of-stock', 'archived']"
          :key="status"
          :variant="statusFilter === status ? 'flat' : 'outlined'"
          color="primary"
          @click="statusFilter = status"
        >
          {{ status }}
        </v-chip>
      </div>

      <UiSkeletonCardGrid v-if="loading" :cards="6" />
      <v-row v-else>
        <v-col v-for="product in visibleProducts" :key="product.id" cols="12" md="6" lg="4">
          <ProductCard
            :product="product"
            :to="`/platform/${slug}/shop/${category}/product/${product.slug}`"
          />
        </v-col>
      </v-row>

      <div v-if="!loading && canLoadMore" class="mt-4 d-flex justify-center">
        <v-btn variant="tonal" color="primary" @click="loadMore">Charger plus</v-btn>
      </div>
    </template>
  </PlatformSplitLayout>
</template>
