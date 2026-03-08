<script setup lang="ts">
import type { BlogComment, BlogRead } from '~/types/api/blog'

const { blog } = defineProps<{
  blog: BlogRead
}>()

const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const countReactions = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + comment.reactions.length + countReactions(comment.children), 0)
</script>

<template>
  <v-card rounded="xl" class="mb-6" variant="tonal">
    <v-card-text>
      <p class="text-overline text-primary mb-1">{{ blog.type.toUpperCase() }}</p>
      <h1 class="text-h5 font-weight-bold mb-2">{{ blog.title }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ blog.posts.length }} posts · statut posts: {{ blog.postStatus }} · statut commentaires: {{ blog.commentStatus }}
      </p>
    </v-card-text>
  </v-card>

  <v-row>
    <v-col v-for="(post, index) in blog.posts" :key="post.id" cols="12" md="6">
      <v-card rounded="xl" class="h-100">
        <v-card-title class="text-subtitle-1 font-weight-bold">Post #{{ index + 1 }}</v-card-title>
        <v-card-text>
          <p class="mb-4">{{ post.content }}</p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" color="primary" variant="tonal">{{ post.comments.length }} commentaires parents</v-chip>
            <v-chip size="small" color="info" variant="tonal">{{ countComments(post.comments) }} commentaires total</v-chip>
            <v-chip size="small" color="pink" variant="tonal">{{ countReactions(post.comments) }} réactions</v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
