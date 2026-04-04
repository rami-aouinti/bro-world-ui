<script setup lang="ts">
import type { SportGameCardItem } from './types'

const props = defineProps<{
  game: SportGameCardItem
}>()

const { t } = useI18n()

const formatScore = (value: number | null) => value === null ? '-' : String(value)

const kickoffLabel = computed(() => {
  if (!props.game.time) {
    return t('sport.kickoffTbd')
  }

  const date = new Date(props.game.time)

  if (Number.isNaN(date.getTime())) {
    return props.game.time
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
})
</script>

<template>
  <v-card variant="outlined" class="h-100">
    <v-card-text class="d-flex flex-column ga-3">
      <div class="d-flex justify-space-between align-center ga-3">
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ game.league }}
        </p>
        <v-chip size="small" variant="tonal" color="primary">
          {{ game.status }}
        </v-chip>
      </div>

      <div class="d-flex justify-space-between align-center ga-4">
        <div class="text-body-1 font-weight-medium">
          {{ game.home }}
        </div>
        <div class="text-h6 font-weight-bold">
          {{ formatScore(game.scores.home) }} - {{ formatScore(game.scores.away) }}
        </div>
        <div class="text-body-1 font-weight-medium text-right">
          {{ game.away }}
        </div>
      </div>

      <div class="d-flex justify-space-between text-caption text-medium-emphasis ga-3">
        <span>{{ game.venue }}</span>
        <span>{{ kickoffLabel }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>
