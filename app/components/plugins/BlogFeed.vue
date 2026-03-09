<script setup lang="ts">
import type { BlogComment, BlogRead } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
}>(), {
  showSummary: true,
})

const emit = defineEmits<{
  refresh: []
}>()

const blogsApi = useBlogsApi()
const actionError = ref('')
const creatingPost = ref(false)
const newPostContent = ref('')
const newPostFilePath = ref('')
const commentDrafts = ref<Record<string, string>>({})

const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)
const countReactions = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + comment.reactions.length + countReactions(comment.children), 0)

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()

const isImageFile = (filePath: string | null): boolean => Boolean(filePath && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath))

const runAction = async (action: () => Promise<unknown>) => {
  try {
    actionError.value = ''
    await action()
    emit('refresh')
  }
  catch (error) {
    console.error(error)
    actionError.value = 'Une action a échoué. Vérifie les données envoyées.'
  }
}

const submitPost = async (blogId: string) => {
  const content = newPostContent.value.trim()
  if (!content) {
    return
  }

  creatingPost.value = true
  await runAction(() => blogsApi.createPost(blogId, {
    content,
    filePath: newPostFilePath.value.trim() || null,
  }))
  creatingPost.value = false
  newPostContent.value = ''
  newPostFilePath.value = ''
}

const createComment = async (payload: { postId: string, parentCommentId: string | null, content: string }) => {
  const content = payload.content.trim()
  if (!content) {
    return
  }

  await runAction(() => blogsApi.createComment(payload.postId, {
    content,
    parentCommentId: payload.parentCommentId,
  }))
}

const createRootComment = async (postId: string) => {
  const draft = (commentDrafts.value[postId] ?? '').trim()
  if (!draft) {
    return
  }

  await createComment({
    postId,
    parentCommentId: null,
    content: draft,
  })
  commentDrafts.value[postId] = ''
}

const editPost = async (postId: string, content: string, filePath: string | null) => {
  const updatedContent = window.prompt('Modifier le post', content)
  if (updatedContent === null) {
    return
  }

  await runAction(() => blogsApi.updatePost(postId, {
    content: updatedContent,
    filePath,
  }))
}
</script>

<template>
  <BlogSummaryCard v-if="showSummary" :blog="blog" />

  <v-card rounded="xl" class="mb-6 pa-4">
    <div class="text-subtitle-1 font-weight-bold mb-3">Créer un post</div>
    <v-textarea v-model="newPostContent" rows="3" variant="outlined" placeholder="Quoi de neuf ?" hide-details class="mb-3" />
    <v-text-field v-model="newPostFilePath" variant="outlined" placeholder="URL image/fichier (optionnel)" hide-details class="mb-3" />
    <v-btn color="primary" :loading="creatingPost" @click="submitPost(blog.id)">Publier</v-btn>
    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-3">{{ actionError }}</v-alert>
  </v-card>

  <v-row v-if="blog?.posts">
    <v-col v-for="post in blog?.posts" :key="post.id" cols="12">
      <v-card rounded="xl" class="h-100 blog-post-card">
        <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap">
          <div class="d-flex align-center ga-3">
            <UiAvatar :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ postAuthorName(post) }}</div>
              <div class="text-caption text-medium-emphasis">Publication</div>
            </div>
          </div>

          <div class="d-flex ga-2">
            <v-btn size="small" variant="text" @click="editPost(post.id, post.content, post.filePath)">Modifier</v-btn>
            <v-btn size="small" variant="text" color="error" @click="runAction(() => blogsApi.deletePost(post.id))">Supprimer</v-btn>
          </div>
        </v-card-title>

        <v-card-text>
          <p class="mb-4 text-body-1">{{ post?.content }}</p>

          <div v-if="post.filePath" class="mb-4">
            <v-img
              v-if="isImageFile(post.filePath)"
              :src="post.filePath"
              max-height="500"
              cover
              class="rounded-xl"
            />

            <v-card v-else variant="outlined" rounded="lg" class="pa-3 d-inline-flex align-center ga-2">
              <v-icon icon="mdi-paperclip" />
              <a :href="post.filePath" target="_blank" rel="noopener" class="text-primary text-decoration-underline">Voir la pièce jointe</a>
            </v-card>
          </div>

          <div class="d-flex align-center justify-space-between text-medium-emphasis text-body-2 mb-3">
            <span>{{ countReactions(post.comments) }} réactions</span>
            <span>{{ countComments(post.comments) }} commentaires</span>
          </div>

          <v-divider class="mb-3" />

          <div v-if="post.comments?.length" class="d-flex flex-column ga-4 mb-3">
            <BlogCommentItem
              v-for="comment in post.comments"
              :key="comment.id"
              :comment="comment"
              :post-id="post.id"
              @add-comment="createComment"
              @edit-comment="runAction(() => blogsApi.updateComment($event.commentId, { content: $event.content }))"
              @delete-comment="runAction(() => blogsApi.deleteComment($event))"
              @add-reaction="runAction(() => blogsApi.createReaction($event.commentId, { type: $event.type }))"
              @edit-reaction="runAction(() => blogsApi.updateReaction($event.reactionId, { type: $event.type }))"
              @delete-reaction="runAction(() => blogsApi.deleteReaction($event))"
            />
          </div>

          <div class="d-flex ga-2 align-center">
            <v-text-field
              v-model="commentDrafts[post.id]"
              density="comfortable"
              variant="solo-filled"
              hide-details
              placeholder="Écrire un commentaire..."
            />
            <v-btn color="primary" variant="flat" @click="createRootComment(post.id)">Envoyer</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.blog-post-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}
</style>
