<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  src?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'busy' | 'none'
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: undefined,
  name: '',
  size: 'md',
  status: 'none',
  rounded: true,
})

const AVATAR_SIZE_TOKENS = {
  xs: { avatar: 24, textClass: 'text-caption', status: 8 },
  sm: { avatar: 32, textClass: 'text-body-2', status: 10 },
  md: { avatar: 40, textClass: 'text-body-2', status: 12 },
  lg: { avatar: 56, textClass: 'text-body-1', status: 14 },
} as const

const STATUS_COLOR_TOKENS = {
  online: 'success',
  offline: 'grey',
  busy: 'error',
} as const

const hasImageError = ref(false)

watch(() => props.src, () => {
  hasImageError.value = false
})

const sizeToken = computed(() => AVATAR_SIZE_TOKENS[props.size])

const initials = computed(() => {
  const words = props.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] ?? ''}${words[words.length - 1][0] ?? ''}`.toUpperCase()
})

const showImage = computed(() => Boolean(props.src) && !hasImageError.value)
const badgeColor = computed(() => props.status !== 'none' ? STATUS_COLOR_TOKENS[props.status] : undefined)
const showStatusBadge = computed(() => props.status !== 'none')
const roundedValue = computed(() => props.rounded ? 'pill' : 'lg')

const onImageError = () => {
  hasImageError.value = true
}
</script>

<template>
  <v-badge
    :model-value="showStatusBadge"
    location="bottom end"
    bordered
    offset-x="2"
    offset-y="2"
    :color="badgeColor"
    :size="sizeToken.status"
  >
    <v-avatar
      :size="sizeToken.avatar"
      :rounded="roundedValue"
      color="primary"
      class="ui-avatar"
      :aria-label="props.name || 'Avatar'"
    >
      <v-img
        v-if="showImage"
        :src="props.src"
        :alt="props.name || 'Avatar'"
        cover
        @error="onImageError"
      />
      <span
        v-else
        class="font-weight-bold text-on-primary"
        :class="sizeToken.textClass"
      >
        {{ initials }}
      </span>
    </v-avatar>
  </v-badge>
</template>

<style scoped>
.ui-avatar {
  user-select: none;
}
</style>
