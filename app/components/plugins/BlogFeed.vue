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

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()
const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)
const flattenComments = (comments: BlogComment[]): BlogComment[] => comments.flatMap(comment => [comment, ...flattenComments(comment.children)])

const reactionMeta: Record<string, { icon: string, color: string }> = {
  like: { icon: '👍', color: '#1877f2' },
  heart: { icon: '❤️', color: '#f25268' },
  laugh: { icon: '😂', color: '#f7b928' },
  wow: { icon: '😮', color: '#f7b928' },
  sad: { icon: '😢', color: '#f7b928' },
  angry: { icon: '😡', color: '#f7b928' },
}

const postReactionSummary = (comments: BlogComment[]) => {
  const map = new Map<string, number>()
  flattenComments(comments).forEach((comment) => {
    comment.reactions.forEach((reaction) => {
      map.set(reaction.type, (map.get(reaction.type) ?? 0) + 1)
    })
  })
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
}

const postReactionCount = (comments: BlogComment[]) => flattenComments(comments)
  .reduce((total, comment) => total + comment.reactions.length, 0)

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

  <v-card rounded="xl" class="mb-6 pa-4 create-post-card">
    <div class="text-subtitle-1 font-weight-bold mb-3 text-white">Créer un post</div>
    <v-textarea v-model="newPostContent" rows="3" variant="solo-filled" placeholder="Quoi de neuf ?" hide-details class="mb-3" />
    <v-text-field v-model="newPostFilePath" variant="solo-filled" placeholder="URL image/fichier (optionnel)" hide-details class="mb-3" />
    <v-btn color="primary" :loading="creatingPost" @click="submitPost(blog.id)">Publier</v-btn>
    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-3">{{ actionError }}</v-alert>
  </v-card>

  <v-row v-if="blog?.posts">
    <v-col v-for="post in blog?.posts" :key="post.id" cols="12">
      <v-card rounded="xl" class="h-100 blog-post-card">
        <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap pb-2">
          <div class="d-flex align-center ga-3">
            <UiAvatar :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            <div>
              <div class="text-subtitle-1 font-weight-bold text-white">{{ postAuthorName(post) }}</div>
              <div class="text-caption text-medium-emphasis">Publication</div>
            </div>
          </div>

          <div v-if="post.isAuthor" class="d-flex ga-2">
            <v-btn size="small" variant="text" @click="editPost(post.id, post.content, post.filePath)">Modifier</v-btn>
            <v-btn size="small" variant="text" color="error" @click="runAction(() => blogsApi.deletePost(post.id))">Supprimer</v-btn>
          </div>
        </v-card-title>

        <v-card-text>
          <p class="mb-4 text-body-1 text-white">{{ post?.content }}</p>

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

          <div class="d-flex align-center justify-space-between text-medium-emphasis text-body-2 mb-3 stats-row">
            <div class="d-flex align-center ga-2">
              <div class="d-flex align-center ga-1">
                <span
                  v-for="[type] in postReactionSummary(post.comments)"
                  :key="type"
                  class="reaction-badge"
                  :style="{ backgroundColor: reactionMeta[type]?.color ?? '#5f6368' }"
                >
                  {{ reactionMeta[type]?.icon ?? '👍' }}
                </span>
              </div>
              <span>{{ postReactionCount(post.comments) }}</span>
            </div>
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
.blog-post-card,
.create-post-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #242526;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.stats-row {
  min-height: 24px;
}

.reaction-badge {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 0 0 2px #242526;
}
</style>
