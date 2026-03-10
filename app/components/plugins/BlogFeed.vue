<script setup lang="ts">
import type { BlogComment, BlogRead, BlogReaction } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { useBlogsStore } from '~/stores/blogs'

const props = withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
  showCreatePost?: boolean
  canInteract?: boolean
}>(), {
  showSummary: true,
  showCreatePost: true,
  canInteract: true,
})

const blogsStore = useBlogsStore()
const actionError = ref('')
const creatingPost = ref(false)
const newPostContent = ref('')
const newPostFilePath = ref('')
const commentDrafts = ref<Record<string, string>>({})
const postReactionPicker = ref<Record<string, boolean>>({})

const editPostDialog = ref(false)
const deletePostDialog = ref(false)
const activePost = ref<BlogRead['posts'][number] | null>(null)
const editPostContent = ref('')
const editPostFilePath = ref('')

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()
const postAuthorProfilePath = (post: BlogRead['posts'][number]) => {
  const username = post.author?.username?.trim()
  return username ? `/user/${encodeURIComponent(username)}/profile` : undefined
}
const reactionAuthorProfilePath = (username?: string) => {
  const normalized = username?.trim()
  return normalized ? `/user/${encodeURIComponent(normalized)}/profile` : undefined
}
const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const reactionMeta: Record<string, { icon: string, color: string, label: string }> = {
  like: { icon: '👍', color: '#1877f2', label: 'Like' },
  heart: { icon: '❤️', color: '#f25268', label: 'Love' },
  laugh: { icon: '😂', color: '#f7b928', label: 'Haha' },
  wow: { icon: '😮', color: '#f7b928', label: 'Wow' },
  sad: { icon: '😢', color: '#f7b928', label: 'Sad' },
  angry: { icon: '😡', color: '#f7b928', label: 'Angry' },
}

const availableReactionTypes = Object.keys(reactionMeta)

const postReactionSummary = (reactions: BlogReaction[] = []) => {
  const map = new Map<string, number>()
  reactions.forEach((reaction) => {
    map.set(reaction.type, (map.get(reaction.type) ?? 0) + 1)
  })

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
}

const groupedPostReactions = (reactions: BlogReaction[] = []) => {
  const grouped = new Map<string, BlogReaction[]>()
  reactions.forEach((reaction) => {
    const current = grouped.get(reaction.type) ?? []
    current.push(reaction)
    grouped.set(reaction.type, current)
  })

  return Array.from(grouped.entries()).map(([type, reactionList]) => ({
    type,
    reactions: reactionList,
  }))
}

const postReactionCount = (reactions: BlogReaction[] = []) => reactions.length

const isImageFile = (filePath: string | null): boolean => Boolean(filePath && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath))

const formatRelativeTime = (dateInput?: string | null) => {
  if (!dateInput) {
    return ''
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, 'day')
  }

  const diffWeeks = Math.round(diffDays / 7)
  if (Math.abs(diffWeeks) < 5) {
    return formatter.format(diffWeeks, 'week')
  }

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, 'month')
  }

  const diffYears = Math.round(diffDays / 365)
  return formatter.format(diffYears, 'year')
}

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
  if (!props.canInteract) {
    return
  }

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
  if (!props.canInteract) {
    return
  }

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
  if (!props.canInteract) {
    return
  }

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

const addPostReaction = async (postId: string, type: string) => {
  if (!props.canInteract) {
    return
  }

  await runAction(() => blogsStore.createPostReaction(postId, { type }))
  postReactionPicker.value[postId] = false
}

const deletePostReaction = async (reactionId: string) => {
  if (!props.canInteract) {
    return
  }

  await runAction(() => blogsStore.deleteReaction(reactionId))
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

  <v-card v-if="showCreatePost" rounded="xl" class="mb-6 pa-4 create-post-card">
    <div class="text-subtitle-1 font-weight-bold mb-3 text-white">Créer un post</div>
    <v-textarea v-model="newPostContent" rows="3" variant="solo-filled" placeholder="Quoi de neuf ?" hide-details class="mb-3" :disabled="!canInteract" />
    <v-text-field v-model="newPostFilePath" variant="solo-filled" placeholder="URL image/fichier (optionnel)" hide-details class="mb-3" :disabled="!canInteract" />
    <v-btn color="primary" :loading="creatingPost" :disabled="!canInteract" @click="submitPost(blog.id)">Publier</v-btn>
    <v-alert v-if="!canInteract" type="info" variant="tonal" class="mt-3">Connectez-vous pour publier, commenter et réagir.</v-alert>
    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-3">{{ actionError }}</v-alert>
  </v-card>

  <v-row v-if="blog?.posts">
    <v-col v-for="post in blog?.posts" :key="post.id" cols="12">
      <v-card rounded="xl" class="h-100 blog-post-card">
        <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap pb-2">
          <div class="d-flex align-center ga-3">
            <NuxtLink v-if="postAuthorProfilePath(post)" :to="postAuthorProfilePath(post)" class="avatar-link">
              <UiAvatar :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            </NuxtLink>
            <UiAvatar v-else :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            <div>
              <NuxtLink
                v-if="postAuthorProfilePath(post)"
                :to="postAuthorProfilePath(post)"
                class="text-subtitle-1 font-weight-bold text-decoration-none text-primary"
              >
                {{ postAuthorName(post) }}
              </NuxtLink>
              <div v-else class="text-subtitle-1 font-weight-bold">{{ postAuthorName(post) }}</div>
              <div v-if="formatRelativeTime(post.createdAt)" class="text-caption text-medium-emphasis">{{ formatRelativeTime(post.createdAt) }}</div>
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
                  v-for="[type] in postReactionSummary(post.reactions ?? [])"
                  :key="type"
                  class="reaction-badge"
                  :style="{ backgroundColor: reactionMeta[type]?.color ?? '#5f6368' }"
                >
                  {{ reactionMeta[type]?.icon ?? '👍' }}
                </span>
              </div>
              <span>{{ postReactionCount(post.reactions ?? []) }}</span>
            </div>
            <span>{{ countComments(post.comments) }} commentaires</span>
          </div>

          <v-divider class="mb-3" />

          <div class="d-flex align-center ga-2 mb-4">
            <v-btn
              rounded="pill"
              size="small"
              variant="text"
              :disabled="!canInteract"
              @click="postReactionPicker[post.id] = !postReactionPicker[post.id]"
            >
              J'aime
            </v-btn>

            <v-menu
              v-if="(post.reactions?.length ?? 0) > 0"
              open-on-hover
              location="top"
              :close-on-content-click="false"
              content-class="reaction-hover-menu"
            >
              <template #activator="{ props: menuProps }">
                <v-btn icon="mdi-emoticon-outline" size="x-small" variant="text" v-bind="menuProps" />
              </template>
              <div class="reaction-hover-content pa-3">
                <div
                  v-for="group in groupedPostReactions(post.reactions ?? [])"
                  :key="group.type"
                  class="d-flex align-center justify-space-between ga-3 mb-2"
                >
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-2">{{ reactionMeta[group.type]?.icon ?? '👍' }}</span>
                    <span class="text-caption text-medium-emphasis">{{ reactionMeta[group.type]?.label ?? group.type }}</span>
                  </div>
                  <div class="d-flex align-center ga-1 flex-wrap justify-end">
                    <NuxtLink
                      v-for="reaction in group.reactions"
                      :key="reaction.id"
                      :to="reactionAuthorProfilePath(reaction.author?.username)"
                      class="avatar-link"
                    >
                      <UiAvatar
                        :src="reaction.author?.photo ?? undefined"
                        :name="`${reaction.author?.firstName ?? ''} ${reaction.author?.lastName ?? ''}`.trim() || 'Unknown User'"
                        size="xs"
                      />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </v-menu>
          </div>

          <div v-if="postReactionPicker[post.id]" class="reaction-picker mt-n2 mb-3">
            <button
              v-for="type in availableReactionTypes"
              :key="type"
              class="reaction-emoji"
              type="button"
              :title="reactionMeta[type]?.label"
              @click="addPostReaction(post.id, type)"
            >
              {{ reactionMeta[type]?.icon ?? '👍' }}
            </button>
          </div>

          <div v-if="post.reactions?.length" class="d-flex flex-wrap ga-2 mt-2 mb-4">
            <button
              v-for="reaction in post.reactions"
              :key="reaction.id"
              type="button"
              class="reaction-pill"
              :title="canInteract && reaction.isAuthor ? 'Cliquer pour supprimer votre réaction' : ''"
              @click="canInteract && reaction.isAuthor ? deletePostReaction(reaction.id) : undefined"
            >
              <span>{{ reactionMeta[reaction.type]?.icon ?? '👍' }}</span>
              <NuxtLink
                v-if="reactionAuthorProfilePath(reaction.author?.username)"
                :to="reactionAuthorProfilePath(reaction.author?.username)"
                class="avatar-link"
                @click.stop
              >
                <UiAvatar
                  :src="reaction.author?.photo ?? undefined"
                  :name="`${reaction.author?.firstName ?? ''} ${reaction.author?.lastName ?? ''}`.trim() || 'Unknown User'"
                  size="xs"
                />
              </NuxtLink>
              <UiAvatar
                v-else
                :src="reaction.author?.photo ?? undefined"
                :name="`${reaction.author?.firstName ?? ''} ${reaction.author?.lastName ?? ''}`.trim() || 'Unknown User'"
                size="xs"
              />
            </button>
          </div>

          <div v-if="post.comments?.length" class="d-flex flex-column ga-4 mb-3">
            <BlogCommentItem
              v-for="comment in post.comments"
              :key="comment.id"
              :comment="comment"
              :post-id="post.id"
              :can-interact="canInteract"
              @add-comment="createComment"
              @edit-comment="canInteract ? runAction(() => blogsStore.updateComment($event.commentId, { content: $event.content })) : undefined"
              @delete-comment="canInteract ? runAction(() => blogsStore.deleteComment($event)) : undefined"
              @add-reaction="canInteract ? runAction(() => blogsStore.createReaction($event.commentId, { type: $event.type })) : undefined"
              @delete-reaction="canInteract ? runAction(() => blogsStore.deleteReaction($event)) : undefined"
            />
          </div>

          <div class="d-flex ga-2 align-center">
            <v-text-field
              v-model="commentDrafts[post.id]"
              density="comfortable"
              variant="solo-filled"
              hide-details
              placeholder="Écrire un commentaire..."
              :disabled="!canInteract"
            />
            <v-btn color="primary" variant="flat" :disabled="!canInteract" @click="createRootComment(post.id)">Envoyer</v-btn>
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

.avatar-link {
  text-decoration: none;
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

.reaction-picker {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 999px;
  padding: 6px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}

.reaction-emoji {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.reaction-emoji:hover {
  transform: translateY(-2px) scale(1.08);
}

.reaction-hover-content {
  min-width: 220px;
  border-radius: 14px;
  backdrop-filter: blur(8px);
  background: rgba(22, 22, 24, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}
</style>
