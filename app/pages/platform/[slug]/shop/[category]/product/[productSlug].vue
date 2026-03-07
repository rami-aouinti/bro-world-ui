<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopStatusChip from '~/components/platform/shop/admin/ShopStatusChip.vue'
import ShopOtherProductsTable from '~/components/platform/shop/ShopOtherProductsTable.vue'
import { shopProducts } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'
import { shopOtherProducts, shopProductGallery, shopProductVariants } from '~/data/shop-product-detail'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const category = computed(() => String(route.params.category ?? 'tech'))
const productSlug = computed(() => String(route.params.productSlug ?? ''))

const product = computed(() => shopProducts.find((item) => item.slug === productSlug.value) ?? shopProducts[0])
const { t } = useI18n()
const { formatCurrency } = usePlatformI18n()

const navItems = computed(() => getShopNav(appSlug.value, false))

const selectedImage = ref(shopProductGallery[0])
const selectedMaterial = ref(shopProductVariants.material[0])
const selectedColor = ref(shopProductVariants.color[0])
const selectedQuantity = ref(shopProductVariants.quantity[0])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.productDetail" :subtitle="product.title" :items="navItems" /></template>
    <section class="d-flex flex-column ga-6">
      <v-card rounded="xl">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="7">
              <v-img :src="selectedImage" :alt="product.title" height="420" class="rounded-lg mb-4" cover />
              <div class="d-flex ga-3 flex-wrap">
                <v-sheet
                  v-for="image in shopProductGallery"
                  :key="image"
                  class="thumbnail-sheet"
                  :class="{ 'thumbnail-sheet--active': selectedImage === image }"
                  rounded="lg"
                  border
                  @click="selectedImage = image"
                >
                  <v-img :src="image" :alt="`Thumbnail ${product.title}`" width="80" height="80" cover class="rounded-lg" />
                </v-sheet>
              </div>
            </v-col>
            <v-col cols="12" md="5">
              <h1 class="text-h5 font-weight-bold mb-2">{{ product.title }}</h1>
              <p class="text-h6 mb-3">{{ formatCurrency(product.price) }}</p>
              <ShopStatusChip class="mb-4" status="stock" :label="t('platform.shop.product.stock', { count: product.stock })" />
              <p class="text-body-2 text-medium-emphasis mb-6">{{ product.description }}</p>

              <div class="d-flex flex-column ga-4">
                <v-select v-model="selectedMaterial" :items="shopProductVariants.material" label="Material" variant="outlined" density="comfortable" hide-details />
                <v-select v-model="selectedColor" :items="shopProductVariants.color" label="Color" variant="outlined" density="comfortable" hide-details />
                <v-select v-model="selectedQuantity" :items="shopProductVariants.quantity" label="Quantity" variant="outlined" density="comfortable" hide-details />
                <ShopPrimaryAction size="large" prepend-icon="mdi-cart-plus">Add to cart</ShopPrimaryAction>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <ShopOtherProductsTable :items="shopOtherProducts" />
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.thumbnail-sheet {
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.thumbnail-sheet:hover {
  transform: translateY(-2px);
}

.thumbnail-sheet--active {
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
