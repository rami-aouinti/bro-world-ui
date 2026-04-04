<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  size?: number
  icon?: string
}>(), {
  src: '',
  alt: 'Avatar',
  size: 24,
  icon: 'mdi-account',
})

const imageFailed = ref(false)

watch(() => props.src, () => {
  imageFailed.value = false
})

const showImage = computed(() => Boolean(props.src) && !imageFailed.value)
</script>

<template>
  <v-img
      v-if="showImage"
      :src="props.src || ''"
      :alt="props.alt"
      :width="size"
      :height="size"
      cover
      @error="imageFailed = true"
      rounded="xl"
  />
  <v-icon v-else :icon="icon" size="60%" color="grey-darken-1" />
</template>

<style scoped>
.football-avatar {
  flex-shrink: 0;
}
</style>
