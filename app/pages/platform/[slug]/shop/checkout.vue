<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { shopProducts } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-4 text-capitalize">{{ page }}</h1>
      <v-row>
        <v-col v-for="(product, i) in shopProducts.slice(0, 5)" :key="product.slug" cols="12" md="6" lg="4">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ page === 'orders' ? t('platform.shop.checkout.card.orderTitle', { id: `10${i + 1}` }) : product.title }}</p>
              <p class="text-body-2 text-medium-emphasis">
                {{ page === 'payment' ? t('platform.shop.checkout.card.paymentDescription') : page === 'checkout' ? t('platform.shop.checkout.card.checkoutDescription') : t('platform.shop.checkout.card.ordersDescription') }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
