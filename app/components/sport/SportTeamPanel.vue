<script setup lang="ts">
import type { SportGameCardItem } from './types'

defineProps<{
  game: SportGameCardItem | null
  teamId: 'home' | 'away' | null
}>()
</script>

<template>
  <v-card variant="tonal" class="pa-4">
    <template v-if="game && teamId">
      <p class="text-overline mb-2">Team panel</p>
      <p class="text-h6 mb-1">{{ teamId === 'home' ? game.home : game.away }}</p>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ game.league }}</p>

      <div class="d-flex justify-space-between mb-2">
        <span>Statut du match</span>
        <span>{{ game.status }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>Score actuel</span>
        <span>{{ teamId === 'home' ? game.scores.home ?? '-' : game.scores.away ?? '-' }}</span>
      </div>
      <div class="d-flex justify-space-between">
        <span>Adversaire</span>
        <span>{{ teamId === 'home' ? game.away : game.home }}</span>
      </div>
    </template>
    <UiEmptyState
      v-else
      title="Aucune équipe sélectionnée"
      description="Cliquez sur une équipe dans la liste pour afficher ce panneau."
      icon="mdi-account-group-outline"
    />
  </v-card>
</template>
