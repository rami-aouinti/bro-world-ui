<script setup lang="ts">
interface Props {
  message?: string
  mode?: 'skeleton' | 'spinner'
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  mode: 'spinner',
})
</script>

<template>
  <div class="ui-loading-state py-2">
    <div
      v-if="props.mode === 'skeleton'"
      class="mb-3"
    >
      <v-skeleton-loader type="paragraph" />
    </div>

    <div
      v-else
      class="d-flex align-center ga-3"
    >
      <v-progress-circular
        indeterminate
        size="20"
        width="2"
      />
    </div>

    <p
      v-if="props.message"
      class="text-body-2 text-medium-emphasis mb-0"
    >
      {{ props.message }}
    </p>
  </div>
</template>
