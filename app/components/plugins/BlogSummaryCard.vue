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
  <v-chip variant="outlined" class="mb-4 title-chip">
    {{ blog?.title }}
  </v-chip>
  <p class="text-body-2 text-high-emphasis mb-3">
    Overview of published content, community activity, and editorial cadence.
  </p>
  <div class="d-flex flex-wrap ga-2 mb-4">
    <v-chip size="small" color="primary" variant="tonal">{{ blog?.posts?.length }} posts</v-chip>
    <v-chip size="small" :color="publicationHealthTone" variant="tonal">Posts: {{ blog?.postStatus }}</v-chip>
    <v-chip size="small" :color="publicationHealthTone" variant="tonal">Commentaires: {{ blog?.commentStatus }}</v-chip>
  </div>
</template>
