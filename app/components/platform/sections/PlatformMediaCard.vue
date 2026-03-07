<script setup lang="ts">
import type { MediaCardItem } from '~/data/platform-enhanced'

const props = defineProps<{ item: MediaCardItem }>()
</script>

<template>
  <v-card rounded="xl" class="media-card h-100" hover>
    <v-img :src="props.item.image" height="170" cover />
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
