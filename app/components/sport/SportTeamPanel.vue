<script setup lang="ts">
import type { SportGameCardItem } from './types'

defineProps<{
  game: SportGameCardItem | null
  teamId: 'home' | 'away' | null
}>()

const { t } = useI18n()
</script>

<template>
  <v-card variant="tonal" class="pa-4">
    <template v-if="game && teamId">
      <p class="text-overline mb-2">{{ t('sport.panels.teamPanel') }}</p>
      <p class="text-h6 mb-1">{{ teamId === 'home' ? game.home : game.away }}</p>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ game.league }}</p>

      <div class="d-flex justify-space-between mb-2">
        <span>{{ t('sport.labels.matchStatus') }}</span>
        <span>{{ game.status }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>{{ t('sport.labels.currentScore') }}</span>
        <span>{{ teamId === 'home' ? game.scores.home ?? '-' : game.scores.away ?? '-' }}</span>
      </div>
      <div class="d-flex justify-space-between">
        <span>{{ t('sport.labels.opponent') }}</span>
        <span>{{ teamId === 'home' ? game.away : game.home }}</span>
      </div>
    </template>
    <UiEmptyState
      v-else
      :title="t('sport.empty.noTeamSelectedTitle')"
      :description="t('sport.empty.noTeamSelectedDescription')"
      icon="mdi-account-group-outline"
    />
  </v-card>
</template>
