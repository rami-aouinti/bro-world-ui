<script setup lang="ts">
import type { SportGameCardItem } from './types'

const props = defineProps<{
  games: SportGameCardItem[]
  selectedGameId: string | null
}>()

const emit = defineEmits<{
  select: [gameId: string]
  'select-team': [teamId: 'home' | 'away']
}>()
</script>

<template>
  <v-list class="py-0" lines="two" density="comfortable" nav>
    <v-list-item
      v-for="game in props.games"
      :key="game.id"
      rounded="lg"
      :active="game.id === props.selectedGameId"
      class="mb-2"
      @click="emit('select', game.id)"
    >
      <template #title>
        <div class="d-flex justify-space-between ga-2">
          <button class="team-link" @click.stop="emit('select-team', 'away')">
            {{ game.away }}
          </button>
          <span class="text-medium-emphasis">@</span>
          <button class="team-link" @click.stop="emit('select-team', 'home')">
            {{ game.home }}
          </button>
        </div>
      </template>
      <template #subtitle>
        <div class="d-flex flex-wrap align-center ga-2 mt-1">
          <v-chip size="x-small" variant="outlined">{{ game.status }}</v-chip>
          <span>{{ game.league }}</span>
          <span>•</span>
          <span>{{ game.time }}</span>
          <span>•</span>
          <span>{{ game.venue }}</span>
        </div>
      </template>
      <template #append>
        <div class="text-right text-body-2">
          <div>{{ game.scores.away ?? '-' }}</div>
          <div>{{ game.scores.home ?? '-' }}</div>
        </div>
      </template>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.team-link {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font: inherit;
  padding: 0;
  text-align: left;
}

.team-link:hover {
  text-decoration: underline;
}
</style>
