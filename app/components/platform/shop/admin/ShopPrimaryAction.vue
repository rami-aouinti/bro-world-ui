<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  disabled?: boolean
  prependIcon?: string
  block?: boolean
  size?: string
}>(), {
  loading: false,
  disabled: false,
  prependIcon: undefined,
  block: false,
  size: undefined,
})

defineEmits<{ click: [] }>()
</script>

<template>
  <v-btn
    color="primary"
    variant="flat"
    class="shop-admin-action"
    :loading="loading"
    :disabled="disabled"
    :prepend-icon="prependIcon"
    :block="block"
    :size="size"
    @click="$emit('click')"
  >
    <slot />
  </v-btn>
</template>
