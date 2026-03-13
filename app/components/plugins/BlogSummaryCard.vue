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
  <p class="text-overline text-primary mb-2">{{ blog?.type?.toUpperCase() }}</p>
  <h1 class="text-h6 font-weight-bold mb-3">{{ blog?.title }}</h1>

  <div class="d-flex flex-wrap ga-2 mb-4">
    <v-chip size="small" color="primary" variant="tonal">{{ blog?.posts?.length }} posts</v-chip>
    <v-chip size="small" :color="publicationHealthTone" variant="tonal">Posts: {{ blog?.postStatus }}</v-chip>
    <v-chip size="small" :color="publicationHealthTone" variant="tonal">Commentaires: {{ blog?.commentStatus }}</v-chip>
  </div>

  <p class="text-body-2 text-medium-emphasis mb-0">
    Overview of published content, community activity, and editorial cadence.
  </p>
</template>