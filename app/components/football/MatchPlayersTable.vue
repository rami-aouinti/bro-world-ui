<script setup lang="ts">
import type { MatchPlayersByTeam } from './types'

const props = defineProps<{
  players: MatchPlayersByTeam[]
}>()

const placeholder = '—'

const rows = computed(() => {
  const output: Array<{
    key: string
    team: string
    player: string
    rating: string | number | null | undefined
    minutes: number | null | undefined
    goals: number | null | undefined
    assists: number | null | undefined
    shots: number | null | undefined
    duels: number | null | undefined
  }> = []

  for (const teamBlock of props.players) {
    const teamName = teamBlock?.team?.name || placeholder

    for (const player of teamBlock?.players || []) {
      const stats = player?.statistics?.[0]
      output.push({
        key: `${teamBlock?.team?.id || teamName}-${player?.player?.id || player?.player?.name || output.length}`,
        team: teamName,
        player: player?.player?.name || placeholder,
        rating: stats?.games?.rating,
        minutes: stats?.games?.minutes,
        goals: stats?.goals?.total,
        assists: stats?.goals?.assists,
        shots: stats?.shots?.total,
        duels: stats?.duels?.total,
      })
    }
  }

  return output
})

const showValue = (value: string | number | null | undefined) => value ?? placeholder
</script>

<template>
  <v-card variant="outlined" class="pa-3">
    <div class="text-subtitle-2 mb-2">Players</div>

    <v-alert v-if="!rows.length" type="info" variant="tonal" density="comfortable">
      Aucune statistique joueur disponible.
    </v-alert>

    <v-table v-else density="compact" class="bg-transparent players-table">
      <thead>
        <tr>
          <th>Équipe</th>
          <th>Joueur</th>
          <th>Note</th>
          <th>Min</th>
          <th>Buts</th>
          <th>Passes</th>
          <th>Tirs</th>
          <th>Duels</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>{{ row.team }}</td>
          <td>{{ row.player }}</td>
          <td>{{ showValue(row.rating) }}</td>
          <td>{{ showValue(row.minutes) }}</td>
          <td>{{ showValue(row.goals) }}</td>
          <td>{{ showValue(row.assists) }}</td>
          <td>{{ showValue(row.shots) }}</td>
          <td>{{ showValue(row.duels) }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.players-table :deep(th),
.players-table :deep(td) {
  white-space: nowrap;
}
</style>
