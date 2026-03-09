<script setup lang="ts">
import type { BlogComment } from '~/types/api/blog'
import UiAvatar from '~/components/ui/UiAvatar.vue'

const props = withDefaults(defineProps<{
  comment: BlogComment
  postId: string
  depth?: number
}>(), {
  depth: 0,
})

const emit = defineEmits<{
  addComment: [payload: { postId: string, parentCommentId: string | null, content: string }]
  editComment: [payload: { commentId: string, content: string }]
  deleteComment: [commentId: string]
  addReaction: [payload: { commentId: string, type: string }]
  deleteReaction: [reactionId: string]
}>()

const reactionMeta: Record<string, { icon: string, label: string, className: string }> = {
  like: { icon: '👍', label: 'Like', className: 'reaction-like' },
  heart: { icon: '❤️', label: 'Love', className: 'reaction-heart' },
  laugh: { icon: '😂', label: 'Haha', className: 'reaction-laugh' },
  wow: { icon: '😮', label: 'Wow', className: 'reaction-wow' },
  sad: { icon: '😢', label: 'Sad', className: 'reaction-sad' },
  angry: { icon: '😡', label: 'Angry', className: 'reaction-angry' },
}

const availableReactionTypes = Object.keys(reactionMeta)

const commentAuthorName = computed(() => {
  const first = props.comment.author?.firstName ?? 'Unknown'
  const last = props.comment.author?.lastName ?? 'User'
  return `${first} ${last}`.trim()
})

const isReplying = ref(false)
const replyContent = ref('')
const showReactionPicker = ref(false)
const marginStart = computed(() => Math.min(props.depth * 24, 72))

const submitReply = () => {
  if (!replyContent.value.trim()) {
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

const editCurrentComment = () => {
  const updatedContent = window.prompt('Modifier le commentaire', props.comment.content)
  if (updatedContent === null) {
    return
  }

  const value = updatedContent.trim()
  if (!value) {
    return
  }

  emit('editComment', {
    commentId: props.comment.id,
    content: value,
  })
}

const addReaction = (type: string) => {
  emit('addReaction', { commentId: props.comment.id, type })
  showReactionPicker.value = false
}
</script>

<template>
  <div class="comment-item" :style="{ marginInlineStart: `${marginStart}px` }">
    <div class="d-flex ga-2 align-start">
      <UiAvatar :src="comment.author?.photo ?? undefined" :name="commentAuthorName" size="sm" />

      <div class="flex-grow-1">
        <div class="comment-bubble px-3 py-2">
          <div class="d-flex align-center justify-space-between ga-2">
            <div class="font-weight-bold text-body-2">{{ commentAuthorName }}</div>
            <v-chip v-if="comment.isAuthor" size="x-small" variant="tonal" color="primary">Owner</v-chip>
          </div>
          <div class="text-body-2 mt-1">{{ comment.content }}</div>
        </div>

        <div class="d-flex align-center flex-wrap ga-3 mt-1 text-caption text-medium-emphasis action-row">
          <button class="action-link" type="button" @click="showReactionPicker = !showReactionPicker">J'aime</button>
          <button class="action-link" type="button" @click="isReplying = !isReplying">Répondre</button>
          <template v-if="comment.isAuthor">
            <button class="action-link" type="button" @click="editCurrentComment">Modifier</button>
            <button class="action-link action-danger" type="button" @click="emit('deleteComment', comment.id)">Supprimer</button>
          </template>
        </div>

        <div v-if="showReactionPicker" class="reaction-picker mt-2">
          <button
            v-for="type in availableReactionTypes"
            :key="type"
            class="reaction-emoji"
            type="button"
            :title="reactionMeta[type]?.label"
            @click="addReaction(type)"
          >
            {{ reactionMeta[type]?.icon ?? '👍' }}
          </button>
        </div>

        <div v-if="comment.reactions?.length" class="d-flex flex-wrap ga-2 mt-2">
          <button
            v-for="reaction in comment.reactions"
            :key="reaction.id"
            type="button"
            class="reaction-pill"
            :class="reactionMeta[reaction.type]?.className"
            :title="reaction.isAuthor ? 'Cliquer pour supprimer votre réaction' : ''"
            @click="reaction.isAuthor ? emit('deleteReaction', reaction.id) : undefined"
          >
            <span>{{ reactionMeta[reaction.type]?.icon ?? '👍' }}</span>
            <span class="text-caption">{{ reaction.type }}</span>
          </button>
        </div>

        <div v-if="isReplying" class="mt-3 d-flex ga-2 align-center">
          <v-text-field v-model="replyContent" density="compact" hide-details variant="solo-filled" placeholder="Écrire une réponse..." />
          <v-btn color="primary" variant="flat" @click="submitReply">Publier</v-btn>
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
        @add-comment="emit('addComment', $event)"
        @edit-comment="emit('editComment', $event)"
        @delete-comment="emit('deleteComment', $event)"
        @add-reaction="emit('addReaction', $event)"
        @delete-reaction="emit('deleteReaction', $event)"
      />
    </div>
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
}

.action-row {
  padding-inline-start: 8px;
}



.action-danger {
  color: #ff9a9a;
}

.reaction-picker {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 999px;
  padding: 6px 8px;
}

.reaction-emoji {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.reaction-emoji:hover {
  transform: translateY(-2px) scale(1.08);
}

.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid transparent;
}

.reaction-pill:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.reaction-like { border-color: rgba(24, 119, 242, 0.5); }
.reaction-heart { border-color: rgba(242, 82, 104, 0.5); }
.reaction-laugh,
.reaction-wow,
.reaction-sad,
.reaction-angry { border-color: rgba(252, 214, 103, 0.5); }
</style>
