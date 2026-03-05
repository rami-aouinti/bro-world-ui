<script setup lang="ts">
interface Props {
  type?: 'success' | 'info' | 'warning' | 'error'
  message?: string
  density?: 'default' | 'comfortable' | 'compact'
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  message: '',
  density: 'default',
  variant: 'tonal',
})
</script>

<template>
  <v-alert
    :type="props.type"
    :density="props.density"
    :variant="props.variant"
  >
    <slot>
      {{ props.message }}
    </slot>
  </v-alert>
</template>
