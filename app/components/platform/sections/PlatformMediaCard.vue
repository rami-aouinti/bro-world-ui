<script setup lang="ts">
import type { MediaCardItem } from '~/data/platform-enhanced'
const props = defineProps<{ item: MediaCardItem }>()
</script>

<template>
  <v-card rounded="xl" class="media-card h-100" hover>
    <v-img :src="props.item.image" height="170" cover />
    <v-card-text>
      <div class="d-flex align-center justify-space-between ga-2 mb-2">
        <p class="font-weight-bold">{{ props.item.title }}</p>
        <v-chip v-if="props.item.metric" size="small" color="primary" variant="tonal">{{ props.item.metric }}</v-chip>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-2">{{ props.item.subtitle }}</p>
      <v-chip v-for="chip in props.item.chips" :key="chip" size="x-small" class="mr-1 mb-1" variant="outlined">{{ chip }}</v-chip>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.media-card { transition: transform .2s ease; }
.media-card:hover { transform: translateY(-4px); }
</style>
