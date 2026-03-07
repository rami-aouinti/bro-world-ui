<script setup lang="ts">
const props = withDefaults(defineProps<{
  sticky?: boolean
  stickyTop?: string
  rounded?: string
}>(), {
  sticky: true,
  stickyTop: '84px',
  rounded: 'lg',
})

const stickyStyle = computed(() => {
  if (!props.sticky) {
    return undefined
  }

  return {
    '--ui-aside-sticky-top': props.stickyTop,
  }
})
</script>

<template>
  <aside class="ui-aside">
    <v-card
      class="ui-aside__card bg-transparent"
      :class="{ 'ui-aside__card--sticky': sticky }"
      :style="stickyStyle"
      :rounded="rounded"
      elevation="0"
    >
      <slot />
    </v-card>
  </aside>
</template>
