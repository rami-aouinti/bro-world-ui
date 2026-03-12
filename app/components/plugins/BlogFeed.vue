<script setup lang="ts">
import type { BlogComment, BlogRead, BlogReaction } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { useBlogsStore } from '~/stores/blogs'
import { useAuthSessionStore } from '~/stores/authSession'
import { BLOG_REACTION_FALLBACK_TYPES, BLOG_REACTION_META } from '~/constants/blogReactions'

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
const authSession = useAuthSessionStore()
const actionError = ref('')
const creatingPost = ref(false)
const newPostContent = ref('')
const newPostFilePath = ref('')
const createPostDialog = ref(false)
const showEmojiMenu = ref(false)
const showPostOptionsDialog = ref(false)
const postPhotoInput = ref<HTMLInputElement | null>(null)
const commentDrafts = ref<Record<string, string>>({})
const postReactionPicker = ref<Record<string, boolean>>({})
const expandedComments = ref<Record<string, boolean>>({})

const editPostDialog = ref(false)
const deletePostDialog = ref(false)
const activePost = ref<BlogRead['posts'][number] | null>(null)
const editPostContent = ref('')
const editPostFilePath = ref('')

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()
const currentUserName = computed(() => {
  const firstName = authSession.profile?.firstName?.trim() ?? ''
  return firstName || 'there'
})
const composerEmojis = ['😀', '😍', '🔥', '🎉', '💡', '🚀']
const postQuickActions = [
  { icon: 'mdi-image-multiple', label: 'Foto/Video', color: '#42c96f' },
  { icon: 'mdi-account-plus', label: 'Personen markieren', color: '#2d8cff' },
  { icon: 'mdi-emoticon-happy-outline', label: 'Gefühl/Aktivität', color: '#f6c244' },
]
const postAllOptions = [
  { icon: 'mdi-image-multiple', label: 'Foto/Video', color: '#42c96f' },
  { icon: 'mdi-account-plus', label: 'Personen markieren', color: '#2d8cff' },
  { icon: 'mdi-emoticon-happy-outline', label: 'Gefühl/Aktivität', color: '#f6c244' },
  { icon: 'mdi-map-marker', label: 'Ort hinzufügen', color: '#ff5d47' },
  { icon: 'mdi-gif', label: 'GIF', color: '#35d0c4' },
  { icon: 'mdi-video-outline', label: 'Live-Video', color: '#ff2f67' },
  { icon: 'mdi-flag-outline', label: 'Lebensereignis', color: '#33a8ff' },
  { icon: 'mdi-heart-circle-outline', label: 'Spenden sammeln', color: '#ff72bb' },
]
const postAuthorProfilePath = (post: BlogRead['posts'][number]) => {
  const username = post.author?.username?.trim()
  return username ? `/user/${encodeURIComponent(username)}/profile` : undefined
}
const reactionAuthorProfilePath = (username?: string) => {
  const normalized = username?.trim()
  return normalized ? `/user/${encodeURIComponent(normalized)}/profile` : undefined
}
const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const reactionMeta = BLOG_REACTION_META

const availableReactionTypes = computed(() => {
  const types = blogsStore.reactionTypes?.length ? blogsStore.reactionTypes : [...BLOG_REACTION_FALLBACK_TYPES]
  return types.filter(type => reactionMeta[type])
})

const currentUserPostReaction = (post: BlogRead['posts'][number]) => post.reactions?.find(reaction => reaction.isAuthor)

const isCurrentUserReaction = (post: BlogRead['posts'][number], type: string) => currentUserPostReaction(post)?.type === type

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

onMounted(() => {
  void blogsStore.fetchReactionTypes()
})

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

const openCreatePostDialog = (seedText?: string) => {
  if (seedText) {
    const spacer = newPostContent.value.trim().length ? ' ' : ''
    newPostContent.value = `${newPostContent.value}${spacer}${seedText}`.trim()
  }
  createPostDialog.value = true
  showEmojiMenu.value = false
}

const triggerPhotoPicker = () => {
  if (!props.canInteract) {
    return
  }

  postPhotoInput.value?.click()
}

const handlePhotoSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })

  newPostFilePath.value = dataUrl
  openCreatePostDialog()
  target.value = ''
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
  createPostDialog.value = false
  showPostOptionsDialog.value = false
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

const addPostReaction = async (post: BlogRead['posts'][number], type: string) => {
  if (!props.canInteract) {
    return
  }

  const ownReaction = currentUserPostReaction(post)
  if (ownReaction?.type === type) {
    await runAction(() => blogsStore.deleteReaction(ownReaction.id))
  }
  else if (ownReaction) {
    await runAction(() => blogsStore.updateReaction(ownReaction.id, { type }))
  }
  else {
    await runAction(() => blogsStore.createPostReaction(post.id, { type }))
  }

  postReactionPicker.value[post.id] = false
}

const deletePostReaction = async (reactionId: string) => {
  if (!props.canInteract) {
    return
  }

  await runAction(() => blogsStore.deleteReaction(reactionId))
}

const handlePostReactionButtonClick = async (post: BlogRead['posts'][number]) => {
  const ownReaction = currentUserPostReaction(post)

  if (ownReaction) {
    await deletePostReaction(ownReaction.id)
    return
  }

  postReactionPicker.value[post.id] = !postReactionPicker.value[post.id]
}

const toggleComments = (postId: string) => {
  expandedComments.value[postId] = !expandedComments.value[postId]
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
    <input
      ref="postPhotoInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="handlePhotoSelected"
    >
    <div class="d-flex align-center ga-3">
      <UiAvatar
        :src="authSession.profile?.photo ?? undefined"
        :name="`${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User'"
        size="md"
      />
      <button
        type="button"
        class="create-post-trigger text-left"
        :disabled="!canInteract"
        @click="openCreatePostDialog()"
      >
        Was machst du gerade, {{ currentUserName }}?
      </button>
      <v-btn icon="mdi-video-outline" variant="text" :disabled="!canInteract" @click="openCreatePostDialog('🎥')" />
      <v-btn icon="mdi-image-outline" variant="text" :disabled="!canInteract" @click="triggerPhotoPicker" />
      <v-menu v-model="showEmojiMenu" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-emoticon-happy-outline" variant="text" :disabled="!canInteract" v-bind="menuProps" />
        </template>
        <v-list density="compact" class="emoji-menu-list">
          <v-list-item
            v-for="emoji in composerEmojis"
            :key="emoji"
            @click="openCreatePostDialog(emoji)"
          >
            <v-list-item-title class="text-h6">{{ emoji }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-alert v-if="!canInteract" type="info" variant="tonal" class="mt-3">Connectez-vous pour publier, commenter et réagir.</v-alert>
    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-3">{{ actionError }}</v-alert>
  </v-card>

  <v-dialog v-model="createPostDialog" max-width="720">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="text-h5 text-center font-weight-bold">Beitrag erstellen</v-card-title>
      <v-card-text>
        <div class="d-flex align-center ga-3 mb-4">
          <UiAvatar
            :src="authSession.profile?.photo ?? undefined"
            :name="`${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User'"
            size="md"
          />
          <div class="text-subtitle-1 font-weight-bold">
            {{ `${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User' }}
          </div>
        </div>
        <v-textarea
          v-model="newPostContent"
          rows="6"
          variant="plain"
          auto-grow
          hide-details
          class="mb-3"
          :placeholder="`Was machst du gerade, ${currentUserName}?`"
          :disabled="!canInteract"
        />

        <v-img
          v-if="newPostFilePath"
          :src="newPostFilePath"
          max-height="260"
          cover
          class="rounded-lg mb-3"
        />

        <v-sheet rounded="lg" variant="outlined" class="pa-3 mb-3 add-to-post-sheet">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="text-subtitle-1 font-weight-bold">Füge noch etwas zu deinem Beitrag hinzu</div>
            <div class="d-flex align-center ga-2">
              <v-btn
                v-for="action in postQuickActions"
                :key="action.label"
                icon
                variant="text"
                :disabled="!canInteract"
                @click="showPostOptionsDialog = true"
              >
                <v-icon :icon="action.icon" :color="action.color" />
              </v-btn>
            </div>
          </div>
        </v-sheet>

        <v-btn block color="primary" :loading="creatingPost" :disabled="!canInteract || !newPostContent.trim()" @click="submitPost(blog.id)">Posten</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showPostOptionsDialog" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-3 py-4">
        <v-btn icon="mdi-arrow-left" variant="text" @click="showPostOptionsDialog = false" />
        <span>Füge noch etwas zu deinem Beitrag hinzu</span>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col v-for="option in postAllOptions" :key="option.label" cols="12" sm="6">
            <v-btn
              block
              variant="text"
              class="justify-start text-none option-btn"
              @click="showPostOptionsDialog = false"
            >
              <v-icon :icon="option.icon" :color="option.color" class="mr-3" />
              {{ option.label }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

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
                  class="reaction-badge reaction-badge--stacked"
                  :style="{ backgroundColor: reactionMeta[type]?.color ?? '#5f6368' }"
                >
                  {{ reactionMeta[type]?.icon ?? '👍' }}
                </span>
              </div>
              <span v-if="postReactionCount(post.reactions ?? []) > 0">{{ postReactionCount(post.reactions ?? []) }}</span>
              <v-menu
                  v-model="postReactionPicker[post.id]"
                  open-on-hover
                  location="top"
                  :close-on-content-click="false"
                  content-class="reaction-hover-menu"
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                      variant="text"
                      type="button"
                      :disabled="!canInteract"
                      v-bind="menuProps"
                      @click.stop.prevent="handlePostReactionButtonClick(post)"
                  >
                    <span class="reaction-action-icon">{{ reactionMeta[currentUserPostReaction(post)?.type ?? 'like']?.icon ?? '👍' }}</span>
                  </v-btn>
                </template>
                <div class="reaction-hover-content pa-3">
                  <div class="reaction-picker mb-3">
                    <button
                        v-for="type in availableReactionTypes"
                        :key="type"
                        class="reaction-emoji"
                        :class="{ 'reaction-emoji--active': isCurrentUserReaction(post, type) }"
                        type="button"
                        :title="reactionMeta[type]?.label"
                        @click="addPostReaction(post, type)"
                    >
                      {{ reactionMeta[type]?.icon ?? '👍' }}
                    </button>
                  </div>
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

            <span v-if="countComments(post.comments) > 0">{{ countComments(post.comments) }}
            <v-icon icon="mdi-comment-outline" @click="toggleComments(post.id)" size="18" />
            </span>
          </div>
          <v-divider class="mb-3" />
          <div v-if="post.comments?.length && expandedComments[post.id]" class="d-flex flex-column ga-4 mb-3">
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
              @update-reaction="canInteract ? runAction(() => blogsStore.updateReaction($event.reactionId, { type: $event.type })) : undefined"
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
  margin-inline-end: -8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 0 0 2px #242526;
}


.reaction-badge--stacked:last-child {
  margin-inline-end: 0;
}

.post-actions-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 6px 0;
}

.post-action-btn {
  flex: 1;
  min-height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 600;
}

.post-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
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

.reaction-emoji--active {
  transform: scale(1.2);
}

.reaction-action-icon {
  font-size: 20px;
  line-height: 1;
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

.create-post-trigger {
  flex: 1;
  min-height: 48px;
  border-radius: 999px;
  padding: 0 18px;
  border: 0;
  color: rgba(var(--v-theme-on-surface), 0.72);
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.create-post-trigger:hover {
  background: rgba(var(--v-theme-on-surface), 0.16);
}

.create-post-trigger:disabled {
  opacity: 0.6;
}

.emoji-menu-list :deep(.v-list-item) {
  min-height: 40px;
}

.add-to-post-sheet {
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.option-btn {
  min-height: 46px;
  font-weight: 600;
}
</style>
