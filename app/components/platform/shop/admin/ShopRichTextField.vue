<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

withDefaults(defineProps<{
  label: string
  rows?: number
  hint?: string
  persistentHint?: boolean
}>(), {
  rows: 4,
  hint: undefined,
  persistentHint: false,
})
</script>

<template>
  <v-textarea
    v-model="modelValue"
    :label="label"
    variant="outlined"
    density="compact"
    hide-details="auto"
    :rows="rows"
    :hint="hint"
    :persistent-hint="persistentHint"
    class="shop-admin-rich-text"
  />
</template>
