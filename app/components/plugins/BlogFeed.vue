<script setup lang="ts">
import type { BlogComment, BlogRead } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'

withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
}>(), {
  showSummary: true,
})

const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const countReactions = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + comment.reactions.length + countReactions(comment.children), 0)
</script>

<template>
  <BlogSummaryCard v-if="showSummary" :blog="blog" />

  <v-row v-if="blog?.posts">
    <v-col v-for="(post, index) in blog?.posts" :key="post.id" cols="12" md="6">
      <v-card rounded="xl" class="h-100">
        <v-card-title class="text-subtitle-1 font-weight-bold">Post #{{ index + 1 }}</v-card-title>
        <v-card-text>
          <p class="mb-4">{{ post?.content }}</p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" color="primary" variant="tonal">{{ post?.comments?.length }} commentaires parents</v-chip>
            <v-chip size="small" color="info" variant="tonal">{{ countComments(post?.comments) }} commentaires total</v-chip>
            <v-chip size="small" color="pink" variant="tonal">{{ countReactions(post?.comments) }} réactions</v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
