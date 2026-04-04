<script setup lang="ts">
import type { SportGameCardItem } from './types'

defineProps<{
  game: SportGameCardItem | null
}>()
</script>

<template>
  <v-card variant="tonal" class="pa-4">
    <template v-if="game">
      <p class="text-overline mb-2">Game details</p>
      <p class="text-h6 mb-1">{{ game.away }} @ {{ game.home }}</p>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ game.league }} • {{ game.time }}</p>
      <v-divider class="mb-4" />
      <div class="d-flex justify-space-between mb-2">
        <span>{{ game.away }}</span>
        <strong>{{ game.scores.away ?? '-' }}</strong>
      </div>
      <div class="d-flex justify-space-between mb-4">
        <span>{{ game.home }}</span>
        <strong>{{ game.scores.home ?? '-' }}</strong>
      </div>
      <v-chip size="small" variant="outlined">{{ game.status }}</v-chip>
      <p class="text-body-2 mt-3 mb-0">Venue: {{ game.venue }}</p>
    </template>
    <UiEmptyState
      v-else
      title="Aucun match sélectionné"
      description="Sélectionnez un match pour afficher les détails."
      icon="mdi-trophy-outline"
    />
  </v-card>
</template>
