<script setup lang="ts">
import type { BlogComment } from '~/types/api/blog'
import UiAvatar from '~/components/ui/UiAvatar.vue'

const props = withDefaults(defineProps<{
  comment: BlogComment
  depth?: number
}>(), {
  depth: 0,
})

const commentAuthorName = computed(() => {
  const first = props.comment.author?.firstName ?? 'Unknown'
  const last = props.comment.author?.lastName ?? 'User'
  return `${first} ${last}`.trim()
})

const isImageFile = (filePath: string | null): boolean => {
  if (!filePath) {
    return false
  }

  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath)
}

const hasAttachment = computed(() => Boolean(props.comment.filePath))
const marginStart = computed(() => Math.min(props.depth * 20, 60))
</script>

<template>
  <div class="comment-item" :style="{ marginInlineStart: `${marginStart}px` }">
    <div class="d-flex ga-3 align-start">
      <UiAvatar :src="comment.author?.photo ?? undefined" :name="commentAuthorName" size="sm" />

      <div class="flex-grow-1">
        <div class="font-weight-bold text-body-1">{{ commentAuthorName }}</div>
        <div class="text-body-2 mt-1">{{ comment.content }}</div>

        <div v-if="hasAttachment" class="mt-2">
          <v-img
            v-if="isImageFile(comment.filePath)"
            :src="comment.filePath ?? ''"
            max-height="240"
            cover
            class="rounded-lg"
          />
          <a v-else :href="comment.filePath ?? '#'" target="_blank" rel="noopener" class="text-primary text-decoration-underline">
            Pièce jointe
          </a>
        </div>

        <div v-if="comment.reactions?.length" class="d-flex flex-wrap ga-2 mt-3">
          <v-chip v-for="reaction in comment.reactions" :key="reaction.id" size="small" variant="tonal" color="primary">
            <template #prepend>
              <v-avatar size="20">
                <v-img :src="reaction.author?.photo ?? ''" />
              </v-avatar>
            </template>
            {{ reaction.type }} · {{ reaction.author?.firstName }} {{ reaction.author?.lastName }}
          </v-chip>
        </div>
      </div>
    </div>

    <div v-if="comment.children?.length" class="mt-3 d-flex flex-column ga-3">
      <BlogCommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-inline-start: 12px;
}
</style>
