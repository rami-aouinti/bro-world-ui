<script setup lang="ts">
import type { BlogComment, BlogRead } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'

withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
}>(), {
  showSummary: true,
})

const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const countReactions = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + comment.reactions.length + countReactions(comment.children), 0)

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()

const isImageFile = (filePath: string | null): boolean => {
  if (!filePath) {
    return false
  }

  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath)
}
</script>

<template>
  <BlogSummaryCard v-if="showSummary" :blog="blog" />

  <v-row v-if="blog?.posts">
    <v-col v-for="(post, index) in blog?.posts" :key="post.id" cols="12">
      <v-card rounded="xl" class="h-100">
        <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap">
          <div class="d-flex align-center ga-3">
            <UiAvatar :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ postAuthorName(post) }}</div>
              <div class="text-caption text-medium-emphasis">Post #{{ index + 1 }}</div>
            </div>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" color="primary" variant="tonal">{{ post?.comments?.length }} parents</v-chip>
            <v-chip size="small" color="info" variant="tonal">{{ countComments(post?.comments) }} commentaires</v-chip>
            <v-chip size="small" color="pink" variant="tonal">{{ countReactions(post?.comments) }} réactions</v-chip>
          </div>
        </v-card-title>

        <v-card-text>
          <p class="mb-4">{{ post?.content }}</p>

          <div v-if="post.filePath" class="mb-4">
            <v-img
              v-if="isImageFile(post.filePath)"
              :src="post.filePath"
              max-height="420"
              cover
              class="rounded-lg"
            />

            <v-card v-else variant="outlined" rounded="lg" class="pa-3 d-inline-flex align-center ga-2">
              <v-icon icon="mdi-paperclip" />
              <a :href="post.filePath" target="_blank" rel="noopener" class="text-primary text-decoration-underline">Voir la pièce jointe</a>
            </v-card>
          </div>

          <div v-if="post.comments?.length" class="d-flex flex-column ga-4">
            <BlogCommentItem
              v-for="comment in post.comments"
              :key="comment.id"
              :comment="comment"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
