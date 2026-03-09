<script setup lang="ts">
import type { BlogRead } from '~/types/api/blog'

defineProps<{
  blog: BlogRead
}>()
</script>

<template>
  <v-card-text>
    <p class="text-overline text-primary mb-1">{{ blog?.type?.toUpperCase() }}</p>
    <h1 class="text-h5 font-weight-bold mb-2">{{ blog?.title }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-0">
      {{ blog?.posts?.length }} posts · statut posts: {{ blog?.postStatus }} · statut commentaires: {{ blog?.commentStatus }}
    </p>
  </v-card-text>
</template>
