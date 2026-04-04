<script setup lang="ts">
import { computed } from 'vue'
import type { SportGameCardItem, SportTeamItem } from './types'

const props = defineProps<{
  game?: SportGameCardItem | null
  teamId?: 'home' | 'away' | null
  team?: SportTeamItem | null
}>()

const { t, te } = useI18n()

const label = (key: string, fallback: string) => (te(key) ? t(key) : fallback)
const selectedTeam = computed(() => props.team || null)
</script>

<template>
  <v-card variant="tonal" class="pa-4">
    <template v-if="selectedTeam">
      <div class="d-flex align-center ga-3 mb-4">
        <v-avatar size="44" rounded="0" color="surface-variant">
          <v-img v-if="selectedTeam.logo" :src="selectedTeam.logo" :alt="selectedTeam.name" cover />
          <v-icon v-else icon="mdi-shield-outline" />
        </v-avatar>
        <div>
          <p class="text-overline mb-1">{{ t('sport.panels.teamPanel') }}</p>
          <p class="text-h6 mb-0">{{ selectedTeam.name }}</p>
        </div>
      </div>

      <div class="d-flex justify-space-between mb-2">
        <span>{{ t('sport.labels.team') }}</span>
        <span>{{ selectedTeam.country || '-' }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>{{ label('sport.labels.founded', 'Founded') }}</span>
        <span>{{ selectedTeam.founded ?? '-' }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>{{ t('sport.labels.venue') }}</span>
        <span>{{ selectedTeam.venue.name || '-' }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>{{ label('sport.labels.city', 'City') }}</span>
        <span>{{ selectedTeam.venue.city || '-' }}</span>
      </div>
      <div class="d-flex justify-space-between">
        <span>{{ label('sport.labels.capacity', 'Capacity') }}</span>
        <span>{{ selectedTeam.venue.capacity ?? '-' }}</span>
      </div>
    </template>

    <template v-else-if="game && teamId">
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
