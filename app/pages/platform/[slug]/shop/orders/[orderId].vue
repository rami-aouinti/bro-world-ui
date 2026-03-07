<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopFormCard from '~/components/platform/shop/admin/ShopFormCard.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import ShopStatusChip from '~/components/platform/shop/admin/ShopStatusChip.vue'
import { getShopNav } from '~/data/platform-nav'
import { shopOrders, type ShopOrder } from '~/data/shop-orders'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const orderId = computed(() => String(route.params.orderId ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()

const order = computed<ShopOrder | undefined>(() => shopOrders.find(item => item.id === orderId.value))

const statusConfig: Record<ShopOrder['status'], { status: 'paid' | 'refunded' | 'canceled', label: string }> = {
  paid: { status: 'paid', label: t('platform.shop.common.statuses.paid') },
  refunded: { status: 'refunded', label: t('platform.shop.common.statuses.refunded') },
  canceled: { status: 'canceled', label: t('platform.shop.common.statuses.canceled') },
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="platform.shop.sidebar.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <section class="d-flex flex-column ga-4">
      <ShopSectionTitle :title="t('platform.shop.orders.detail.title')" :subtitle="t('platform.shop.orders.detail.subtitle')" />

      <ShopFormCard v-if="order">
        <v-card-text class="d-flex flex-column ga-4">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div>
              <p class="text-overline mb-1">{{ t('platform.shop.orders.detail.labels.order') }}</p>
              <p class="text-h6 mb-0">{{ order.orderNumber }}</p>
            </div>
            <ShopStatusChip :status="statusConfig[order.status].status" :label="statusConfig[order.status].label" />
          </div>

          <v-divider />

          <v-row>
            <v-col cols="12" md="6">
              <p class="text-overline mb-1">{{ t('platform.shop.orders.detail.labels.customer') }}</p>
              <p class="mb-0 font-weight-medium">{{ order.customer.name }}</p>
              <p class="text-medium-emphasis mb-0">{{ order.customer.email }}</p>
            </v-col>
            <v-col cols="6" md="3">
              <p class="text-overline mb-1">{{ t('platform.shop.orders.detail.labels.items') }}</p>
              <p class="mb-0">{{ order.items }}</p>
            </v-col>
            <v-col cols="6" md="3">
              <p class="text-overline mb-1">{{ t('platform.shop.orders.detail.labels.revenue') }}</p>
              <p class="mb-0">{{ order.revenue }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p class="text-overline mb-1">{{ t('platform.shop.orders.detail.labels.createdAt') }}</p>
              <p class="mb-0">{{ order.createdAt }}</p>
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-end">
              <v-btn variant="text" color="primary" :to="`/platform/${slug}/shop/orders`" prepend-icon="mdi-arrow-left">
                {{ t('platform.shop.common.buttons.backToOrders') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </ShopFormCard>

      <ShopFormCard v-else>
        <v-card-text>
          <p class="mb-0 text-body-1">{{ t('platform.shop.orders.detail.notFound') }}</p>
        </v-card-text>
      </ShopFormCard>
    </section>
  </PlatformSplitLayout>
</template>
