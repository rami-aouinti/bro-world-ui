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
  editReaction: [payload: { reactionId: string, type: string }]
  deleteReaction: [reactionId: string]
}>()

const commentAuthorName = computed(() => {
  const first = props.comment.author?.firstName ?? 'Unknown'
  const last = props.comment.author?.lastName ?? 'User'
  return `${first} ${last}`.trim()
})

const isReplying = ref(false)
const replyContent = ref('')
const marginStart = computed(() => Math.min(props.depth * 20, 60))

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

const reactionTypes = ['like', 'heart', 'laugh']
</script>

<template>
  <div class="comment-item" :style="{ marginInlineStart: `${marginStart}px` }">
    <div class="d-flex ga-3 align-start">
      <UiAvatar :src="comment.author?.photo ?? undefined" :name="commentAuthorName" size="sm" />

      <div class="flex-grow-1">
        <div class="comment-bubble pa-3">
          <div class="font-weight-bold text-body-2">{{ commentAuthorName }}</div>
          <div class="text-body-2 mt-1">{{ comment.content }}</div>
        </div>

        <div class="d-flex align-center flex-wrap ga-3 mt-2 text-caption text-medium-emphasis">
          <button class="action-link" @click="isReplying = !isReplying">Répondre</button>
          <button class="action-link" @click="editCurrentComment">Modifier</button>
          <button class="action-link" @click="emit('deleteComment', comment.id)">Supprimer</button>

          <div class="d-flex ga-1">
            <v-btn
              v-for="type in reactionTypes"
              :key="type"
              size="x-small"
              variant="tonal"
              color="primary"
              @click="emit('addReaction', { commentId: comment.id, type })"
            >
              {{ type }}
            </v-btn>
          </div>
        </div>

        <div v-if="comment.reactions?.length" class="d-flex flex-wrap ga-2 mt-2">
          <v-chip v-for="reaction in comment.reactions" :key="reaction.id" size="small" variant="outlined">
            {{ reaction.type }}
            <template #append>
              <v-icon size="14" icon="mdi-pencil" class="ms-1" @click="emit('editReaction', { reactionId: reaction.id, type: 'heart' })" />
              <v-icon size="14" icon="mdi-close" class="ms-1" @click="emit('deleteReaction', reaction.id)" />
            </template>
          </v-chip>
        </div>

        <div v-if="isReplying" class="mt-3 d-flex ga-2">
          <v-text-field v-model="replyContent" density="compact" hide-details placeholder="Écrire une réponse..." />
          <v-btn color="primary" @click="submitReply">Publier</v-btn>
        </div>
      </div>
    </div>

    <div v-if="comment.children?.length" class="mt-3 d-flex flex-column ga-3">
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
        @edit-reaction="emit('editReaction', $event)"
        @delete-reaction="emit('deleteReaction', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-inline-start: 12px;
}

.comment-bubble {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
}

.action-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
