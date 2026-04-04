<script setup lang="ts">
import { computed } from 'vue'
import type { SportGameCardItem } from './types'

const props = defineProps<{
  games: SportGameCardItem[]
}>()

const pseudoStandings = computed(() => {
  const table = new Map<string, { name: string, points: number }>()

  for (const game of props.games) {
    const awayScore = game.scores.away ?? 0
    const homeScore = game.scores.home ?? 0

    if (!table.has(game.away)) {
      table.set(game.away, { name: game.away, points: 0 })
    }
    if (!table.has(game.home)) {
      table.set(game.home, { name: game.home, points: 0 })
    }

    table.get(game.away)!.points += awayScore
    table.get(game.home)!.points += homeScore
  }

  return [...table.values()].sort((a, b) => b.points - a.points).slice(0, 8)
})
</script>

<template>
  <v-card variant="tonal" class="pa-4">
    <p class="text-overline mb-2">Standings (snapshot)</p>
    <v-table density="comfortable">
      <thead>
        <tr>
          <th>#</th>
          <th>Équipe</th>
          <th class="text-right">Points</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(team, index) in pseudoStandings" :key="team.name">
          <td>{{ index + 1 }}</td>
          <td>{{ team.name }}</td>
          <td class="text-right">{{ team.points }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
