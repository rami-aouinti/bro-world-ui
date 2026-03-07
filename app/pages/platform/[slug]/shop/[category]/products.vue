<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { shopProducts } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const category = computed(() => String(route.params.category ?? 'tech'))
const { isOwner } = usePlatformPermissions(slug)

const products = computed(() => shopProducts.filter((item) => item.category === category.value))
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop" :subtitle="`Catégorie ${category}`" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-5">Produits — {{ category }}</h1>
      <v-row>
        <v-col v-for="product in products" :key="product.slug" cols="12" md="6" lg="4">
          <v-card rounded="xl" hover :to="`/platform/${slug}/shop/${category}/product/${product.slug}`">
            <v-card-text>
              <p class="text-h4 mb-2">{{ product.cover }}</p>
              <p class="font-weight-bold">{{ product.title }}</p>
              <p class="text-body-2 text-medium-emphasis">€ {{ product.price }} · {{ product.stock }} en stock</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
