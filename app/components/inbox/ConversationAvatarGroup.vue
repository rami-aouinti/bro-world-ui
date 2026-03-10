<script setup lang="ts">
import { computed } from 'vue'
interface AvatarItem {
  id: string
  photo: string | null
  label: string
}

const props = withDefaults(defineProps<{
  participants: AvatarItem[]
  size?: number
}>(), {
  size: 40,
})

const visibleParticipants = computed(() => props.participants.slice(0, 4))
const avatarSize = computed(() => Math.max(Math.floor(props.size / 1.8), 16))
</script>

<template>
  <div class="conversation-avatar-group" :style="{ width: `${size}px`, height: `${size}px` }">
    <v-avatar
      v-for="(participant, index) in visibleParticipants"
      :key="participant.id"
      :size="avatarSize"
      class="conversation-avatar-group__avatar"
      :style="{ left: `${index * 10}px`, zIndex: visibleParticipants.length - index }"
    >
      <v-img
        v-if="participant.photo"
        :src="participant.photo"
        :alt="participant.label"
        cover
      />
      <span v-else class="text-caption font-weight-medium">{{ participant.label.charAt(0).toUpperCase() }}</span>
    </v-avatar>
  </div>
</template>

<style scoped>
.conversation-avatar-group {
  position: relative;
}

.conversation-avatar-group__avatar {
  position: absolute;
  top: 0;
  border: 2px solid rgb(var(--v-theme-surface));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>
