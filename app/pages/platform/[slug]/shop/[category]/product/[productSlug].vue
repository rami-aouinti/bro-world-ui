<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { shopProducts } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const appSlug = computed(() => String(route.path.split('/')[2] ?? ''))
const category = computed(() => String(route.params.category ?? 'tech'))
const productSlug = computed(() => String(route.params.productSlug ?? ''))

const product = computed(() => shopProducts.find((item) => item.slug === productSlug.value) ?? shopProducts[0])
const { t } = useI18n()
const { formatCurrency } = usePlatformI18n()

const navItems = computed(() => getShopNav(appSlug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.productDetail" :subtitle="product.title" :items="navItems" /></template>
    <section>
      <v-card rounded="xl">
        <v-card-text>
          <p class="text-h2 mb-2">{{ product.cover }}</p>
          <h1 class="text-h5 font-weight-bold mb-2">{{ product.title }}</h1>
          <p class="mb-3">{{ product.description }}</p>
          <div class="d-flex ga-2 align-center flex-wrap">
            <v-chip color="primary" variant="tonal">{{ t(`platform.shop.categories.${category}`) }}</v-chip>
            <v-chip>⭐ {{ product.rating }}</v-chip>
            <v-chip>{{ t('platform.shop.product.stock', { count: product.stock }) }}</v-chip>
            <v-chip color="success">{{ formatCurrency(product.price) }}</v-chip>
          </div>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
