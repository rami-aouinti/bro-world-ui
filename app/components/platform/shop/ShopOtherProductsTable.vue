<script setup lang="ts">
import type { ShopOtherProduct } from '~/data/shop-product-detail'

interface Props {
  items: ShopOtherProduct[]
}

defineProps<Props>()
const { t } = useI18n()
const { formatCurrency } = usePlatformI18n()

const headers = [
  { title: t('platform.shop.productDetail.otherProducts.headers.product'), key: 'title' },
  { title: t('platform.shop.productDetail.otherProducts.headers.price'), key: 'price', align: 'end' },
  { title: t('platform.shop.productDetail.otherProducts.headers.rating'), key: 'rating', align: 'center' },
  { title: t('platform.shop.productDetail.otherProducts.headers.availability'), key: 'availability', align: 'center' },
] as const

const availabilityColor = (availability: number) => {
  if (availability >= 80) return 'success'
  if (availability >= 60) return 'warning'
  return 'error'
}
</script>

<template>
  <v-card rounded="xl">
    <v-card-title class="text-h6">{{ t('platform.shop.productDetail.otherProducts.title') }}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      item-value="id"
      density="compact"
      class="other-products-table"
      hide-default-footer
    >
      <template #item.title="{ item }">
        <div class="d-flex align-center ga-3 py-2">
          <v-avatar color="primary" variant="tonal" size="36">{{ item.title.slice(0, 2).toUpperCase() }}</v-avatar>
          <div>
            <p class="font-weight-medium mb-0">{{ item.title }}</p>
            <p class="text-caption text-medium-emphasis mb-0">{{ t('platform.shop.productDetail.otherProducts.sku', { id: item.id }) }}</p>
          </div>
        </div>
      </template>

      <template #item.price="{ item }">
        <span class="font-weight-bold">{{ formatCurrency(item.price, 'USD') }}</span>
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
