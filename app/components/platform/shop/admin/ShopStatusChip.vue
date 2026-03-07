<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  status?: 'paid' | 'refunded' | 'canceled' | 'active' | 'draft' | 'stock'
}>(), {
  status: 'active',
})

const toneByStatus = computed(() => {
  switch (props.status) {
    case 'paid':
    case 'active':
    case 'stock':
      return 'primary'
    case 'refunded':
      return 'warning'
    case 'canceled':
      return 'error'
    case 'draft':
      return 'secondary'
    default:
      return 'primary'
  }
})
</script>

<template>
  <v-chip :color="toneByStatus" variant="tonal" class="shop-admin-status-chip">
    {{ label }}
  </v-chip>
</template>
