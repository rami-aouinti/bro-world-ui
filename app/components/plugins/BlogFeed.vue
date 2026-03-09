<script setup lang="ts">
import type { BlogComment, BlogRead } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { useBlogsStore } from '~/stores/blogs'

withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
}>(), {
  showSummary: true,
})

const blogsStore = useBlogsStore()
const actionError = ref('')
const creatingPost = ref(false)
const newPostContent = ref('')
const newPostFilePath = ref('')
const commentDrafts = ref<Record<string, string>>({})

const editPostDialog = ref(false)
const deletePostDialog = ref(false)
const activePost = ref<BlogRead['posts'][number] | null>(null)
const editPostContent = ref('')
const editPostFilePath = ref('')

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
  await runAction(() => blogsStore.createPost(blogId, {
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

  await runAction(() => blogsStore.createComment(payload.postId, {
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

const openEditPostDialog = (post: BlogRead['posts'][number]) => {
  activePost.value = post
  editPostContent.value = post.content
  editPostFilePath.value = post.filePath ?? ''
  editPostDialog.value = true
}

const openDeletePostDialog = (post: BlogRead['posts'][number]) => {
  activePost.value = post
  deletePostDialog.value = true
}

const confirmEditPost = async () => {
  if (!activePost.value || !editPostContent.value.trim()) {
    return
  }

  await runAction(() => blogsStore.updatePost(activePost.value!.id, {
    content: editPostContent.value.trim(),
    filePath: editPostFilePath.value.trim() || null,
  }))
  editPostDialog.value = false
}

const confirmDeletePost = async () => {
  if (!activePost.value) {
    return
  }

  await runAction(() => blogsStore.deletePost(activePost.value!.id))
  deletePostDialog.value = false
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
              <div class="text-subtitle-1 font-weight-bold">{{ postAuthorName(post) }}</div>
            </div>
          </div>

          <v-menu v-if="post.isAuthor" location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="menuProps" />
            </template>
            <v-list density="compact" nav>
              <v-list-item prepend-icon="mdi-pencil" title="Modifier" @click="openEditPostDialog(post)" />
              <v-list-item prepend-icon="mdi-delete" title="Supprimer" base-color="error" @click="openDeletePostDialog(post)" />
            </v-list>
          </v-menu>
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
              @edit-comment="runAction(() => blogsStore.updateComment($event.commentId, { content: $event.content }))"
              @delete-comment="runAction(() => blogsStore.deleteComment($event))"
              @add-reaction="runAction(() => blogsStore.createReaction($event.commentId, { type: $event.type }))"
              @delete-reaction="runAction(() => blogsStore.deleteReaction($event))"
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

  <v-dialog v-model="editPostDialog" max-width="680">
    <v-card rounded="xl">
      <v-card-title>Modifier le post</v-card-title>
      <v-card-text>
        <v-textarea v-model="editPostContent" rows="4" variant="solo-filled" class="mb-3" />
        <v-text-field v-model="editPostFilePath" variant="solo-filled" placeholder="URL image/fichier (optionnel)" />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="editPostDialog = false">Annuler</v-btn>
        <v-btn color="primary" @click="confirmEditPost">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deletePostDialog" max-width="420">
    <v-card rounded="xl">
      <v-card-title>Supprimer le post</v-card-title>
      <v-card-text>Cette action est irréversible.</v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="deletePostDialog = false">Annuler</v-btn>
        <v-btn color="error" @click="confirmDeletePost">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
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
