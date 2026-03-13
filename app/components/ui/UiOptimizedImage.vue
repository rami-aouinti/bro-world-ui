<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  alt: string
  width: number
  height: number
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'auto' | 'sync'
  sizes?: string
  srcset?: string
  webpSrcset?: string
  avifSrcset?: string
  fetchpriority?: 'high' | 'low' | 'auto'
  class?: string
}>(), {
  loading: 'lazy',
  decoding: 'async',
  fetchpriority: 'auto',
  sizes: undefined,
  srcset: undefined,
  webpSrcset: undefined,
  avifSrcset: undefined,
  class: undefined,
})
</script>

<template>
  <picture>
    <source v-if="props.avifSrcset" :srcset="props.avifSrcset" type="image/avif">
    <source v-if="props.webpSrcset" :srcset="props.webpSrcset" type="image/webp">
    <img
      :src="props.src"
      :srcset="props.srcset"
      :sizes="props.sizes"
      :alt="props.alt"
      :width="props.width"
      :height="props.height"
      :loading="props.loading"
      :decoding="props.decoding"
      :fetchpriority="props.fetchpriority"
      :class="props.class"
    >
  </picture>
</template>
