<script setup lang="ts">
import type { LineupEntry, MatchLineup } from './types'

const props = defineProps<{
  lineups: MatchLineup[]
}>()

const placeholder = '—'

const playerLabel = (entry: LineupEntry) => {
  const player = entry?.player
  const name = player?.name || placeholder
  const number = player?.number == null ? '' : `#${player.number}`
  const pos = player?.pos || ''
  return [number, name, pos].filter(Boolean).join(' · ')
}
</script>

<template>
  <v-card variant="outlined" class="pa-3">
    <div class="text-subtitle-2 mb-2">Lineups</div>

    <v-alert v-if="!props.lineups.length" type="info" variant="tonal" density="comfortable">
      Aucune composition disponible.
    </v-alert>

    <div v-else class="lineups-grid">
      <v-card v-for="(lineup, index) in props.lineups" :key="`${lineup?.team?.id || index}`" variant="tonal" class="pa-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-body-2 font-weight-bold">{{ lineup?.team?.name || placeholder }}</div>
          <v-chip size="x-small" label>{{ lineup?.formation || placeholder }}</v-chip>
        </div>

        <div class="text-caption text-medium-emphasis mb-1">XI titulaires</div>
        <v-list density="compact" class="bg-transparent py-0 mb-2">
          <v-list-item
            v-for="(entry, starterIndex) in lineup?.startXI || []"
            :key="`starter-${lineup?.team?.id || index}-${starterIndex}`"
            :title="playerLabel(entry)"
            class="px-1"
          />
          <v-list-item v-if="!(lineup?.startXI || []).length" title="—" class="px-1" />
        </v-list>

        <div class="text-caption text-medium-emphasis mb-1">Remplaçants</div>
        <v-list density="compact" class="bg-transparent py-0">
          <v-list-item
            v-for="(entry, subIndex) in lineup?.substitutes || []"
            :key="`sub-${lineup?.team?.id || index}-${subIndex}`"
            :title="playerLabel(entry)"
            class="px-1"
          />
          <v-list-item v-if="!(lineup?.substitutes || []).length" title="—" class="px-1" />
        </v-list>
      </v-card>
    </div>
  </v-card>
</template>

<style scoped>
.lineups-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
</style>
