<script setup lang="ts">
import type { ShopOtherProduct } from '~/data/shop-product-detail'

interface Props {
  items: ShopOtherProduct[]
}

defineProps<Props>()

const headers = [
  { title: 'Product', key: 'title' },
  { title: 'Price', key: 'price', align: 'end' },
  { title: 'Rating', key: 'rating', align: 'center' },
  { title: 'Availability', key: 'availability', align: 'center' },
] as const

const availabilityColor = (availability: number) => {
  if (availability >= 80) return 'success'
  if (availability >= 60) return 'warning'
  return 'error'
}
</script>

<template>
  <v-card rounded="xl">
    <v-card-title class="text-h6">Other Products</v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      item-value="id"
      density="comfortable"
      class="other-products-table"
      hide-default-footer
    >
      <template #item.title="{ item }">
        <div class="d-flex align-center ga-3 py-2">
          <v-avatar color="primary" variant="tonal" size="36">{{ item.title.slice(0, 2).toUpperCase() }}</v-avatar>
          <div>
            <p class="font-weight-medium mb-0">{{ item.title }}</p>
            <p class="text-caption text-medium-emphasis mb-0">SKU #{{ item.id }}</p>
          </div>
        </div>
      </template>

      <template #item.price="{ item }">
        <span class="font-weight-bold">${{ item.price.toFixed(2) }}</span>
      </template>

      <template #item.rating="{ item }">
        <v-rating :model-value="item.rating" readonly density="compact" size="small" color="amber" half-increments />
      </template>

      <template #item.availability="{ item }">
        <div class="d-flex align-center ga-2">
          <v-progress-linear
            :model-value="item.availability"
            :color="availabilityColor(item.availability)"
            height="8"
            min="0"
            max="100"
            rounded="pill"
            class="availability-progress"
          />
          <span class="text-caption">{{ item.availability }}%</span>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.other-products-table :deep(.v-data-table-header__content) {
  font-weight: 700;
}

.availability-progress {
  min-width: 120px;
}
</style>
