<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { shopCategories, shopProducts, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const isOwner = computed(() => true)

const filteredProducts = computed(() => shopProducts.slice(0, 6))
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/shop`
  const items: NavItem[] = shopCategories.map((category) => ({
    title: category,
    icon: 'mdi-shape-outline',
    to: `${base}/${category}/products`,
  }))
  items.unshift({ title: 'Accueil shop', icon: 'mdi-storefront-outline', to: `${base}/home` })
  items.push({ title: 'Checkout', icon: 'mdi-cart-outline', to: `${base}/checkout` })
  items.push({ title: 'Orders', icon: 'mdi-package-variant-closed', to: `${base}/orders` })
  items.push({ title: 'Payment', icon: 'mdi-cash-fast', to: `${base}/payment` })
  if (isOwner.value) items.push({ title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` })
  return items
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="Shop" :subtitle="`Application ${slug}`" :items="navItems" />
    </template>

    <section>
      <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-5">
        <div>
          <h1 class="text-h5 font-weight-bold">Shop Highlights</h1>
          <p class="text-body-2 text-medium-emphasis">Cards produit animées et prêtes pour pagination API.</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus">Ajouter produit</v-btn>
      </div>
      <v-row>
        <v-col v-for="product in filteredProducts" :key="product.slug" cols="12" sm="6" lg="4">
          <v-card rounded="xl" class="shop-card h-100" hover :to="`/platform/${slug}/shop/${product.category}/product/${product.slug}`">
            <v-card-text>
              <div class="text-h3 mb-2">{{ product.cover }}</div>
              <p class="text-subtitle-1 font-weight-bold">{{ product.title }}</p>
              <p class="text-body-2 text-medium-emphasis mb-2">{{ product.description }}</p>
              <div class="d-flex justify-space-between align-center">
                <v-chip size="small" color="primary" variant="tonal">{{ product.category }}</v-chip>
                <p class="text-subtitle-2 font-weight-bold">€ {{ product.price }}</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.shop-card { transition: transform .2s ease; }
.shop-card:hover { transform: translateY(-5px) scale(1.01); }
</style>
