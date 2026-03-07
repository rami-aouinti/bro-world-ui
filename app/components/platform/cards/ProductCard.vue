<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import type { ShopProduct } from '~/data/platform/shop'

interface Props {
  product: ShopProduct
  to: string
}

const props = defineProps<Props>()

const subtitle = computed(() => `${props.product.sku} · ${props.product.priceEur} € · Stock ${props.product.stock}`)
</script>

<template>
  <EntityCard
    :title="props.product.title"
    :subtitle="subtitle"
    :category="props.product.category"
    :status="props.product.status"
    :tags="props.product.tags"
    date-label="Publié"
    :date-value="props.product.publishedAt"
    :to="props.to"
  />
</template>
