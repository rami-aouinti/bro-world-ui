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
  <v-avatar
    :size="size"
    :width="size"
    :height="size"
    color="grey-lighten-3"
    class="football-avatar"
  >
    <v-img
      v-if="showImage"
      :src="props.src || ''"
      :alt="props.alt"
      :width="size"
      :height="size"
      cover
      @error="imageFailed = true"
    />
    <v-icon v-else :icon="icon" size="60%" color="grey-darken-1" />
  </v-avatar>
</template>

<style scoped>
.football-avatar {
  flex-shrink: 0;
}
</style>
