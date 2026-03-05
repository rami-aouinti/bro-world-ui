<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  align?: 'start' | 'center' | 'end'
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  align: 'start',
  dense: false,
})

const textAlignClass = computed(() => {
  if (props.align === 'center') return 'text-center'
  if (props.align === 'end') return 'text-end'
  return 'text-start'
})

const actionJustifyClass = computed(() => {
  if (props.align === 'center') return 'justify-center'
  if (props.align === 'end') return 'justify-end'
  return 'justify-start'
})
</script>

<template>
  <div
    v-if="props.title || props.subtitle || $slots.actions"
    class="ui-section-header d-flex flex-wrap align-center justify-space-between"
    :class="[props.dense ? 'ga-2 mb-3' : 'ga-3 mb-4']"
  >
    <div class="ui-section-header__content" :class="textAlignClass">
      <h1 v-if="props.title" class="font-weight-bold" :class="props.dense ? 'text-h6 mb-1' : 'text-h5 mb-2'">
        {{ props.title }}
      </h1>
      <p v-if="props.subtitle" class="text-body-2 text-medium-emphasis mb-0">
        {{ props.subtitle }}
      </p>
    </div>

    <div
      v-if="$slots.actions"
      class="ui-section-header__actions d-flex flex-wrap"
      :class="[props.dense ? 'ga-1' : 'ga-2', actionJustifyClass]"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.ui-section-header__content {
  min-width: 0;
}

@media (max-width: 600px) {
  .ui-section-header__content,
  .ui-section-header__actions {
    width: 100%;
  }
}
</style>
