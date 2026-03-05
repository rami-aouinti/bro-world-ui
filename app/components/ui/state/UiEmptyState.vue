<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'mdi-information-outline',
})
</script>

<template>
  <div class="ui-empty-state text-center text-medium-emphasis py-6">
    <v-icon
      :icon="props.icon"
      size="40"
      class="mb-2"
    />

    <p class="text-subtitle-1 font-weight-medium mb-1 text-high-emphasis">
      {{ props.title }}
    </p>

    <p
      v-if="props.description"
      class="text-body-2 mb-0"
    >
      {{ props.description }}
    </p>

    <div
      v-if="$slots.action"
      class="mt-4"
    >
      <slot name="action" />
    </div>
  </div>
</template>
