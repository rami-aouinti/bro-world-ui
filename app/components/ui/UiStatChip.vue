<script setup lang="ts">
interface Props {
  value: string | number
  color?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  icon: '',
})
</script>

<template>
  <v-chip size="small" variant="tonal" :color="props.color" class="font-weight-medium">
    <v-icon v-if="props.icon" start :icon="props.icon" size="16" />
    {{ props.value }}
  </v-chip>
</template>
