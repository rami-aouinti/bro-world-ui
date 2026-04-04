<script setup lang="ts">
import type { MatchStatisticTeam } from './types'

const props = defineProps<{
  statistics: MatchStatisticTeam[]
}>()

const placeholder = '—'

const parseNumeric = (value: string | number | null | undefined) => {
  if (value == null) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const cleaned = value.replace('%', '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const rows = computed(() => {
  const [homeStats, awayStats] = props.statistics
  const map = new Map<string, { home: string | number | null | undefined, away: string | number | null | undefined }>()

  for (const stat of homeStats?.statistics || []) {
    const key = String(stat?.type || placeholder)
    map.set(key, { home: stat?.value, away: null })
  }

  for (const stat of awayStats?.statistics || []) {
    const key = String(stat?.type || placeholder)
    const existing = map.get(key) || { home: null, away: null }
    existing.away = stat?.value
    map.set(key, existing)
  }

  return Array.from(map.entries()).map(([type, value]) => {
    const homeNumber = parseNumeric(value.home)
    const awayNumber = parseNumeric(value.away)
    const total = (homeNumber || 0) + (awayNumber || 0)

    return {
      type,
      home: value.home,
      away: value.away,
      homePercent: total > 0 && homeNumber != null ? Math.round((homeNumber / total) * 100) : 50,
      awayPercent: total > 0 && awayNumber != null ? Math.round((awayNumber / total) * 100) : 50,
    }
  })
})
</script>

<template>
  <div class="pa-4">
    <v-alert v-if="!rows.length" type="info" variant="tonal" density="comfortable">
      Aucune statistique disponible.
    </v-alert>

    <div v-else class="stats-list">
      <div v-for="row in rows" :key="row.type" class="stats-row">
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <strong>{{ row.home ?? placeholder }}</strong>
          <span class="text-medium-emphasis">{{ row.type }}</span>
          <strong>{{ row.away ?? placeholder }}</strong>
        </div>

        <div class="bars">
          <div class="bar home" :style="{ width: `${row.homePercent}%` }" />
          <div class="bar away" :style="{ width: `${row.awayPercent}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-list {
  display: grid;
  gap: 10px;
}

.bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.bar {
  height: 8px;
  border-radius: 999px;
}

.bar.home {
  justify-self: end;
  background: rgb(var(--v-theme-primary));
}

.bar.away {
  justify-self: start;
  background: rgb(var(--v-theme-secondary));
}
</style>
