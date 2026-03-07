<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
  prependIcon?: string
  block?: boolean
  size?: string
}>(), {
  disabled: false,
  prependIcon: undefined,
  block: false,
  size: undefined,
})

defineEmits<{ click: [] }>()
</script>

<template>
  <v-btn
    variant="outlined"
    class="shop-admin-action"
    :disabled="disabled"
    :prepend-icon="prependIcon"
    :block="block"
    :size="size"
    @click="$emit('click')"
  >
    <slot />
  </v-btn>
</template>
