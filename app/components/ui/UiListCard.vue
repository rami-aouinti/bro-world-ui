<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'

interface Props {
  selected?: boolean
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  loading: false,
  disabled: false,
})
</script>

<template>
  <UiCard
    class="ui-list-card h-100"
    kind="interactive"
    rounded="2xl"
    :selected="props.selected"
    :loading="props.loading"
    :disabled="props.disabled"
  >
    <slot />
  </UiCard>
</template>

<style scoped>
.ui-list-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
