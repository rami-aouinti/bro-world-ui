<script setup lang="ts">
interface Props {
  as?: 'p' | 'span' | 'div'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'p',
})
</script>

<template>
  <component :is="props.as" class="text-caption text-medium-emphasis">
    <slot />
  </component>
</template>
