<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { shopCategories, shopProducts, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const isOwner = computed(() => true)
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/shop`
  const items: NavItem[] = [{ title: 'Accueil shop', icon: 'mdi-storefront-outline', to: `${base}/home` }]
  items.push(...shopCategories.map((c) => ({ title: c, icon: 'mdi-shape-outline', to: `${base}/${c}/products` })))
  items.push({ title: 'Checkout', icon: 'mdi-cart-outline', to: `${base}/checkout` })
  items.push({ title: 'Orders', icon: 'mdi-package-variant-closed', to: `${base}/orders` })
  items.push({ title: 'Payment', icon: 'mdi-cash-fast', to: `${base}/payment` })
  if (isOwner.value) items.push({ title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` })
  return items
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-4 text-capitalize">{{ page }}</h1>
      <v-row>
        <v-col v-for="(product, i) in shopProducts.slice(0, 5)" :key="product.slug" cols="12" md="6" lg="4">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ page === 'orders' ? `Order #10${i + 1}` : product.title }}</p>
              <p class="text-body-2 text-medium-emphasis">
                {{ page === 'payment' ? 'Paiement sécurisé multi-provider prêt à brancher.' : page === 'checkout' ? 'Résumé panier + adresses + livraison.' : 'Suivi de commandes, statuts et retours.' }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
