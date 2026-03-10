<script setup lang="ts">
import type { BlogRead } from '~/types/api/blog'

const props = defineProps<{
  blog: BlogRead
}>()

const publicationHealthTone = computed(() => {
  const isOpen = props.blog.postStatus === 'open' && props.blog.commentStatus === 'open'
  return isOpen ? 'success' : 'warning'
})
</script>

<template>
  <v-card rounded="xl" class="summary-card pa-4" variant="outlined">
    <p class="text-overline text-primary mb-2">{{ blog?.type?.toUpperCase() }}</p>
    <h1 class="text-h6 font-weight-bold mb-3">{{ blog?.title }}</h1>

    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-chip size="small" color="primary" variant="tonal">{{ blog?.posts?.length }} posts</v-chip>
      <v-chip size="small" :color="publicationHealthTone" variant="tonal">Posts: {{ blog?.postStatus }}</v-chip>
      <v-chip size="small" :color="publicationHealthTone" variant="tonal">Commentaires: {{ blog?.commentStatus }}</v-chip>
    </div>

    <p class="text-body-2 text-medium-emphasis mb-0">
      Vue d’ensemble du contenu publié, de l’activité communautaire et du rythme éditorial.
    </p>
  </v-card>
</template>

<style scoped>
.summary-card {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 0.96), rgba(var(--v-theme-surface-variant), 0.3));
}
</style>
