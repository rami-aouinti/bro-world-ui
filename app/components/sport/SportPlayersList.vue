<script setup lang="ts">
import type { SportPlayerItem } from './types'

const props = defineProps<{
  players: SportPlayerItem[]
  selectedPlayerId: string | null
}>()

const emit = defineEmits<{
  select: [playerId: string]
}>()
</script>

<template>
  <v-list class="py-0" lines="two" density="comfortable" nav>
    <v-list-item
      v-for="player in props.players"
      :key="player.id"
      rounded="lg"
      :active="player.id === props.selectedPlayerId"
      class="mb-2"
      @click="emit('select', player.id)"
    >
      <template #prepend>
        <v-avatar size="32" color="surface-variant">
          <v-img v-if="player.photo" :src="player.photo" :alt="player.name" cover />
          <v-icon v-else icon="mdi-account-outline" />
        </v-avatar>
      </template>

      <template #title>
        <div class="d-flex align-center justify-space-between ga-2">
          <span>{{ player.name }}</span>
          <v-chip v-if="player.position" size="x-small" variant="outlined">{{ player.position }}</v-chip>
        </div>
      </template>

      <template #subtitle>
        <div class="d-flex flex-wrap align-center ga-2 mt-1">
          <span>{{ player.team || 'Unknown team' }}</span>
          <template v-if="player.league">
            <span>•</span>
            <span>{{ player.league }}</span>
          </template>
          <template v-if="player.age">
            <span>•</span>
            <span>{{ player.age }} yrs</span>
          </template>
        </div>
      </template>
    </v-list-item>
  </v-list>
</template>
