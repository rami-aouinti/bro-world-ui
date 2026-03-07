<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import productPlaceholder from '~/assets/img/products/product-12.jpg'
import type { MediaCardItem } from '~/data/platform-enhanced'

const FALLBACK_MEDIA_IMAGE = productPlaceholder

const props = defineProps<{ item: MediaCardItem }>()

const hasImageError = ref(false)

const imageSource = computed(() => (hasImageError.value ? FALLBACK_MEDIA_IMAGE : props.item.image))
const imageSrcSet = computed(() => {
  if (hasImageError.value) {
    return undefined
  }

  return `${props.item.image} 1200w`
})

watch(
  () => props.item.image,
  () => {
    hasImageError.value = false
  },
)

function onImageError() {
  hasImageError.value = true
}
</script>

<template>
  <v-card rounded="xl" class="media-card h-100" hover>
    <v-img
      :src="imageSource"
      :srcset="imageSrcSet"
      sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
      height="170"
      cover
      loading="lazy"
      decoding="async"
      @error="onImageError"
    >
      <template #placeholder>
        <div class="media-card__image-skeleton ui-skeleton-block ui-skeleton-block--card" />
      </template>
      <template #error>
        <v-img :src="FALLBACK_MEDIA_IMAGE" height="170" cover class="media-card__fallback" />
      </template>
    </v-img>

    <v-card-text>
      <div class="d-flex align-center justify-space-between ga-2 mb-2">
        <p class="media-card__title font-weight-bold">{{ props.item.title }}</p>
        <v-chip
          v-if="props.item.metric"
          size="small"
          color="primary"
          variant="tonal"
          class="media-card__metric"
        >
          {{ props.item.metric }}
        </v-chip>
      </div>
      <p class="media-card__subtitle text-body-2 mb-2">{{ props.item.subtitle }}</p>
      <v-chip
        v-for="chip in props.item.chips"
        :key="chip"
        size="x-small"
        class="media-card__chip mr-1 mb-1"
        variant="outlined"
      >
        {{ chip }}
      </v-chip>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.media-card {
  border: 1px solid var(--platform-color-border);
  background: linear-gradient(
    160deg,
    var(--platform-color-surface) 0%,
    var(--platform-color-surface-muted) 100%
  );
  box-shadow: var(--platform-shadow-sm);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.media-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--platform-shadow-md);
}

.media-card__image-skeleton {
  width: 100%;
  height: 170px;
  border-radius: 0;
}

.media-card__fallback :deep(img) {
  object-fit: cover;
}

.media-card__title {
  color: var(--platform-color-text-primary);
}

.media-card__subtitle {
  color: var(--platform-color-text-secondary);
}

.media-card__metric {
  background-color: var(--platform-color-accent-soft);
}

.media-card__chip {
  color: var(--platform-color-text-secondary);
  border-color: var(--platform-color-border-strong);
}
</style>
