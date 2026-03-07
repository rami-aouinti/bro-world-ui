<script setup lang="ts">
import type { ShopOrder } from '~/data/shop-orders'

interface TableHeader {
  title: string
  key: keyof ShopOrder | 'customer' | 'status'
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  width?: string | number
}

interface Props {
  orders: ShopOrder[]
}

const props = defineProps<Props>()

const selectedOrderIds = ref<string[]>([])
const page = ref(1)
const itemsPerPage = 5

const headers: TableHeader[] = [
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Date', key: 'createdAt', sortable: true },
  { title: 'Items', key: 'items', align: 'center', sortable: true },
  { title: 'Revenue', key: 'revenue', align: 'end', sortable: true },
]

const pageCount = computed(() => Math.max(1, Math.ceil(props.orders.length / itemsPerPage)))

const paginatedOrders = computed(() => {
  const start = (page.value - 1) * itemsPerPage

  return props.orders.slice(start, start + itemsPerPage)
})

watch(() => props.orders.length, () => {
  page.value = 1
})

const statusConfig: Record<ShopOrder['status'], { color: string, label: string }> = {
  paid: { color: 'success', label: 'Paid' },
  refunded: { color: 'warning', label: 'Refunded' },
  canceled: { color: 'error', label: 'Canceled' },
}
</script>

<template>
  <v-card rounded="xl" variant="outlined">
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
        <v-chip size="small" variant="tonal" :color="statusConfig[item.status].color">
          {{ statusConfig[item.status].label }}
        </v-chip>
      </template>

      <template #item.items="{ item }">
        <div class="text-center">{{ item.items }}</div>
      </template>

      <template #item.revenue="{ item }">
        <div class="text-right font-weight-medium">{{ item.revenue }}</div>
      </template>
    </v-data-table>

    <v-divider />

    <div class="d-flex align-center justify-space-between px-4 py-3">
      <p class="text-caption text-medium-emphasis mb-0">
        {{ selectedOrderIds.length }} selected · {{ props.orders.length }} orders
      </p>
      <v-pagination v-model="page" :length="pageCount" density="comfortable" total-visible="6" />
    </div>
  </v-card>
</template>

<style scoped>
.shop-orders-table :deep(th) {
  font-weight: 700;
}
</style>
