<script setup lang="ts">
import type { BlogComment, BlogReaction } from '~/types/api/blog'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { BLOG_REACTION_FALLBACK_TYPES, BLOG_REACTION_META } from '~/constants/blogReactions'

const props = withDefaults(defineProps<{
  comment: BlogComment
  postId: string
  depth?: number
  canInteract?: boolean
}>(), {
  depth: 0,
  canInteract: true,
})

const emit = defineEmits<{
  addComment: [payload: { postId: string, parentCommentId: string | null, content: string }]
  editComment: [payload: { commentId: string, content: string }]
  deleteComment: [commentId: string]
  addReaction: [payload: { commentId: string, type: string }]
  updateReaction: [payload: { reactionId: string, type: string }]
  deleteReaction: [reactionId: string]
}>()

const reactionMeta = BLOG_REACTION_META

const availableReactionTypes = [...BLOG_REACTION_FALLBACK_TYPES]

const commentAuthorName = computed(() => {
  const first = props.comment.author?.firstName ?? 'Unknown'
  const last = props.comment.author?.lastName ?? 'User'
  return `${first} ${last}`.trim()
})

const commentAuthorProfilePath = computed(() => {
  const username = props.comment.author?.username?.trim()
  return username ? `/user/${encodeURIComponent(username)}/profile` : undefined
})

const reactionAuthorProfilePath = (username?: string) => {
  const normalized = username?.trim()
  return normalized ? `/user/${encodeURIComponent(normalized)}/profile` : undefined
}

const commentRelativeDate = computed(() => formatRelativeTime(props.comment.createdAt))


const normalizeAttachmentUrl = (filePath?: string | null) => {
  if (!filePath) {
    return ''
  }

  return filePath.trim()
}

const isImageAttachment = (filePath?: string | null) => {
  const normalized = normalizeAttachmentUrl(filePath)
  return Boolean(normalized && /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(normalized))
}

const isVideoAttachment = (filePath?: string | null) => {
  const normalized = normalizeAttachmentUrl(filePath)
  return Boolean(normalized && /\.(mp4|webm|mov|m4v|avi|mkv)(\?.*)?$/i.test(normalized))
}

const groupedReactions = computed(() => {
  const grouped = new Map<string, BlogReaction[]>()
  for (const reaction of props.comment.reactions ?? []) {
    const key = reaction.type
    const current = grouped.get(key) ?? []
    current.push(reaction)
    grouped.set(key, current)
  }

  return Array.from(grouped.entries()).map(([type, reactions]) => ({
    type,
    reactions,
  }))
})

const reactionSummary = computed(() => {
  return groupedReactions.value
    .map(group => [group.type, group.reactions.length] as const)
    .sort(([, countA], [, countB]) => countB - countA)
})

const reactionCount = computed(() => props.comment.reactions?.length ?? 0)

const isReplying = ref(false)
const replyContent = ref('')
const showReactionPicker = ref(false)
const marginStart = computed(() => Math.min(props.depth * 24, 72))
const editDialog = ref(false)
const deleteDialog = ref(false)
const editContent = ref('')

const submitReply = () => {
  if (!props.canInteract || !replyContent.value.trim()) {
    return
  }

  emit('addComment', {
    postId: props.postId,
    parentCommentId: props.comment.id,
    content: replyContent.value.trim(),
  })
  replyContent.value = ''
  isReplying.value = false
}

const openEditDialog = () => {
  editContent.value = props.comment.content
  editDialog.value = true
}

const confirmEdit = () => {
  const value = editContent.value.trim()
  if (!value) {
    return
  }

  emit('editComment', {
    commentId: props.comment.id,
    content: value,
  })
  editDialog.value = false
}

const addReaction = (type: string) => {
  if (!props.canInteract) {
    return
  }

  const ownReaction = props.comment.reactions?.find(reaction => reaction.isAuthor)
  if (ownReaction?.type === type) {
    emit('deleteReaction', ownReaction.id)
  }
  else if (ownReaction) {
    emit('updateReaction', { reactionId: ownReaction.id, type })
  }
  else {
    emit('addReaction', { commentId: props.comment.id, type })
  }

  showReactionPicker.value = false
}

const ownReaction = computed(() => props.comment.reactions?.find(reaction => reaction.isAuthor))

const onReactionActionClick = () => {
  if (!props.canInteract) {
    return
  }

  if (ownReaction.value) {
    emit('deleteReaction', ownReaction.value.id)
    return
  }

  showReactionPicker.value = !showReactionPicker.value
}

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
</script>

<template>
  <div class="comment-item" :style="{ marginInlineStart: `${marginStart}px` }">
    <div class="d-flex ga-2 align-start">
      <NuxtLink v-if="commentAuthorProfilePath" :to="commentAuthorProfilePath" class="avatar-link">
        <UiAvatar :src="comment.author?.photo ?? undefined" :name="commentAuthorName" size="sm" />
      </NuxtLink>
      <UiAvatar v-else :src="comment.author?.photo ?? undefined" :name="commentAuthorName" size="sm" />

      <div class="flex-grow-1">
        <div class="comment-bubble px-3 py-2">
          <div class="d-flex align-center justify-space-between ga-2">
            <div>
              <NuxtLink
                v-if="commentAuthorProfilePath"
                :to="commentAuthorProfilePath"
                class="font-weight-bold text-body-2 text-decoration-none text-primary"
              >
                {{ commentAuthorName }}
              </NuxtLink>
              <div v-else class="font-weight-bold text-body-2">{{ commentAuthorName }}</div>
              <div v-if="commentRelativeDate" class="text-caption text-medium-emphasis">{{ commentRelativeDate }}</div>
            </div>
            <div class="d-flex align-center ga-2">
              <v-chip v-if="comment.isAuthor" size="x-small" variant="tonal" color="primary">Owner</v-chip>
              <v-menu v-if="comment.isAuthor && canInteract" location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn icon="mdi-dots-vertical" size="x-small" variant="text" v-bind="menuProps" />
                </template>
                <v-list density="compact" nav>
                  <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="openEditDialog" />
                  <v-list-item prepend-icon="mdi-delete" title="Delete" base-color="error" @click="deleteDialog = true" />
                </v-list>
              </v-menu>
            </div>
          </div>
          <div class="text-body-2 mt-1">{{ comment.content }}</div>
          <div v-if="comment.filePath" class="mt-2">
            <img
              v-if="isImageAttachment(comment.filePath)"
              :src="comment.filePath"
              alt="Comment attachment"
              class="comment-attachment-image"
            >
            <video
              v-else-if="isVideoAttachment(comment.filePath)"
              :src="comment.filePath"
              controls
              class="comment-attachment-image"
            />
            <a v-else :href="comment.filePath" target="_blank" rel="noopener" class="text-primary text-decoration-underline">View attachment</a>
          </div>
        </div>

        <div class="d-flex align-center justify-space-between text-medium-emphasis text-body-2 mt-2 action-row">
          <div class="d-flex align-center ga-2">
            <div class="d-flex align-center ga-1">
              <span
                v-for="[type] in reactionSummary"
                :key="type"
                class="reaction-badge reaction-badge--stacked"
              >
                {{ reactionMeta[type]?.icon ?? '👍' }}
              </span>
            </div>
            <span v-if="reactionCount > 0">{{ reactionCount }}</span>
            <v-menu
              v-model="showReactionPicker"
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
                  :title="ownReaction ? 'Delete my reaction' : 'React'"
                  v-bind="menuProps"
                  @click.stop.prevent="onReactionActionClick"
                >
                  <span class="reaction-action-icon">{{ reactionMeta[ownReaction?.type ?? 'like']?.icon ?? '👍' }}</span>
                </v-btn>
              </template>
              <div class="reaction-hover-content pa-3">
                <div class="reaction-picker mb-3">
                  <button
                    v-for="type in availableReactionTypes"
                    :key="type"
                    class="reaction-emoji"
                    :class="{ 'reaction-emoji--active': ownReaction?.type === type }"
                    type="button"
                    :title="reactionMeta[type]?.label"
                    @click="addReaction(type)"
                  >
                    {{ reactionMeta[type]?.icon ?? '👍' }}
                  </button>
                </div>
                <div
                  v-for="group in groupedReactions"
                  :key="group.type"
                  class="d-flex align-center justify-space-between ga-3 mb-2"
                >
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-2">{{ reactionMeta[group.type]?.icon ?? '👍' }}</span>
                    <span class="text-caption text-medium-emphasis">{{ reactionMeta[group.type]?.label ?? group.type }}</span>
                  </div>
                  <div class="d-flex align-center ga-1 flex-wrap justify-end">
                    <template v-for="reaction in group.reactions" :key="reaction.id">
                      <NuxtLink
                        v-if="reactionAuthorProfilePath(reaction.author?.username)"
                        :to="reactionAuthorProfilePath(reaction.author?.username)"
                        class="avatar-link"
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
                    </template>
                  </div>
                </div>
              </div>
            </v-menu>
          </div>
          <v-btn
            icon="mdi-message-outline"
            size="small"
            variant="text"
            :disabled="!canInteract"
            title="Reply"
            @click="canInteract ? isReplying = !isReplying : undefined"
          />
        </div>

        <div v-if="isReplying" class="mt-3 comment-reply-composer">
          <div class="comment-reply-composer-panel">
            <v-text-field
              v-model="replyContent"
              density="comfortable"
              variant="plain"
              hide-details
              single-line
              class="comment-reply-composer-input"
              placeholder="Write a reply..."
              :disabled="!canInteract"
              @keydown.enter.prevent="submitReply"
            />
            <div class="comment-reply-composer-actions">
              <v-spacer />
              <v-btn
                icon="mdi-send"
                size="small"
                variant="text"
                color="primary"
                :disabled="!canInteract || !replyContent.trim()"
                title="Envoyer"
                @click="submitReply"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="comment.children?.length" class="mt-3 d-flex flex-column ga-3 children-wrapper">
      <BlogCommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :post-id="postId"
        :depth="depth + 1"
        :can-interact="canInteract"
        @add-comment="emit('addComment', $event)"
        @edit-comment="emit('editComment', $event)"
        @delete-comment="emit('deleteComment', $event)"
        @add-reaction="emit('addReaction', $event)"
        @update-reaction="emit('updateReaction', $event)"
        @delete-reaction="emit('deleteReaction', $event)"
      />
    </div>

    <v-dialog v-model="editDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title>Edit comment</v-card-title>
        <v-card-text>
          <v-textarea v-model="editContent" rows="3" variant="solo-filled" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmEdit">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title>Delete le commentaire</v-card-title>
        <v-card-text>This action is irreversible.</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="emit('deleteComment', comment.id); deleteDialog = false">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.comment-item {
  position: relative;
}

.children-wrapper {
  border-left: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-inline-start: 12px;
}

.comment-bubble {
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-surface-variant), 0.35));
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
}

.action-row {
  padding-inline-start: 4px;
}

.reaction-badge {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
}

.reaction-badge--stacked + .reaction-badge--stacked {
  margin-inline-start: -6px;
}

.avatar-link {
  text-decoration: none;
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

.comment-reply-composer {
  padding-top: 4px;
}

.comment-reply-composer-panel {
  border-radius: 20px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 6px 12px 8px;
}

.comment-reply-composer-input :deep(.v-field) {
  box-shadow: none;
  background: transparent;
}

.comment-reply-composer-input :deep(.v-field__input) {
  min-height: 32px;
  padding-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.comment-reply-composer-actions {
  display: flex;
  align-items: center;
  min-height: 34px;
}

.comment-reply-composer-actions :deep(.v-btn) {
  border-radius: 50%;
}

</style>
