<script setup lang="ts">
import ShopFormCard from '~/components/platform/shop/admin/ShopFormCard.vue'
import ShopStatusChip from '~/components/platform/shop/admin/ShopStatusChip.vue'
import type { ShopOrder } from '~/data/shop-orders'
import { getShopRoute } from '~/data/platform-nav'

interface TableHeader {
  title: string
  key: keyof ShopOrder | 'customer' | 'status' | 'actions'
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  width?: string | number
}

interface Props {
  orders: ShopOrder[]
  platformSlug: string
}

const props = defineProps<Props>()
const { t } = useI18n()

const selectedOrderIds = ref<string[]>([])
const page = ref(1)
const itemsPerPage = 5

const headers: TableHeader[] = [
  { title: t('platform.shop.orders.table.headers.order'), key: 'orderNumber', sortable: true },
  { title: t('platform.shop.orders.table.headers.customer'), key: 'customer', sortable: false },
  { title: t('platform.shop.orders.table.headers.status'), key: 'status', sortable: false },
  { title: t('platform.shop.orders.table.headers.date'), key: 'createdAt', sortable: true },
  { title: t('platform.shop.orders.table.headers.items'), key: 'items', align: 'center', sortable: true },
  { title: t('platform.shop.orders.table.headers.revenue'), key: 'revenue', align: 'end', sortable: true },
  { title: t('platform.shop.orders.table.headers.actions'), key: 'actions', align: 'end', sortable: false, width: 140 },
]

const pageCount = computed(() => Math.max(1, Math.ceil(props.orders.length / itemsPerPage)))

const paginatedOrders = computed(() => {
  const start = (page.value - 1) * itemsPerPage

  return props.orders.slice(start, start + itemsPerPage)
})

watch(() => props.orders.length, () => {
  page.value = 1
})

const statusConfig: Record<ShopOrder['status'], { status: 'paid' | 'refunded' | 'canceled', label: string }> = {
  paid: { status: 'paid', label: t('platform.shop.common.statuses.paid') },
  refunded: { status: 'refunded', label: t('platform.shop.common.statuses.refunded') },
  canceled: { status: 'canceled', label: t('platform.shop.common.statuses.canceled') },
}
</script>

<template>
  <ShopFormCard>
    <v-data-table
      v-model="selectedOrderIds"
      class="shop-orders-table"
      :headers="headers"
      :items="paginatedOrders"
      item-value="id"
      show-select
      hide-default-footer
      hover
    >
      <template #item.customer="{ item }">
        <div class="d-flex align-center ga-3">
          <v-avatar size="36">
            <v-img :src="item.customer.avatar" :alt="item.customer.name" cover />
          </v-avatar>
          <div>
            <p class="text-body-2 font-weight-medium mb-0">{{ item.customer.name }}</p>
            <p class="text-caption text-medium-emphasis mb-0">{{ item.customer.email }}</p>
          </div>
        </div>
      </template>

      <template #item.status="{ item }">
        <ShopStatusChip :status="statusConfig[item.status].status" :label="statusConfig[item.status].label" />
      </template>

      <template #item.items="{ item }">
        <div class="text-center">{{ item.items }}</div>
      </template>

      <template #item.revenue="{ item }">
        <div class="text-right font-weight-medium">{{ item.revenue }}</div>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end">
          <v-btn
            size="small"
            color="primary"
            variant="text"
            :to="getShopRoute('orderDetail', { slug: props.platformSlug, orderId: item.id })"
          >
            {{ t('platform.shop.common.buttons.viewDetails') }}
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <v-divider />

    <div class="d-flex align-center justify-space-between px-4 py-3">
      <p class="text-caption text-medium-emphasis mb-0">
        {{ t('platform.shop.orders.table.selectedSummary', { selected: selectedOrderIds.length, total: props.orders.length }) }}
      </p>
      <v-pagination v-model="page" :length="pageCount" density="comfortable" total-visible="6" />
    </div>
  </ShopFormCard>
</template>

<style scoped>
.shop-orders-table :deep(th) {
  font-weight: 700;
}
</style>
