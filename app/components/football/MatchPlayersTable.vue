<script setup lang="ts">
import FootballAvatar from './FootballAvatar.vue'
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
    photo: string | null | undefined
    number: number | null | undefined
    position: string | null | undefined
    rating: string | number | null | undefined
    minutes: number | null | undefined
    goals: number | null | undefined
    assists: number | null | undefined
  }> = []

  for (const teamBlock of props.players) {
    const teamName = teamBlock?.team?.name || placeholder

    for (const player of teamBlock?.players || []) {
      const stats = player?.statistics?.[0]
      output.push({
        key: `${teamBlock?.team?.id || teamName}-${player?.player?.id || player?.player?.name || output.length}`,
        team: teamName,
        player: player?.player?.name || placeholder,
        photo: player?.player?.photo,
        number: player?.player?.number,
        position: stats?.games?.position,
        rating: stats?.games?.rating,
        minutes: stats?.games?.minutes,
        goals: stats?.goals?.total,
        assists: stats?.goals?.assists,
      })
    }
  }

  return output
})

const showValue = (value: string | number | null | undefined) => value ?? placeholder
</script>

<template>
  <div class="pa-3">
    <v-alert v-if="!rows.length" type="info" variant="tonal" density="comfortable">
      Aucune statistique joueur disponible.
    </v-alert>

    <v-table v-else density="compact" class="bg-transparent players-table">
      <thead>
      <tr>
        <th>Équipe</th>
        <th>Joueur</th>
        <th>Min</th>
        <th>Buts</th>
        <th>Passes</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="row in rows" :key="row.key">
        <td>{{ row.team }}</td>
        <td>
          <div class="d-flex align-center ga-2 player-row">
            <FootballAvatar :src="row.photo" :alt="`Photo ${row.player}`" :size="24" icon="mdi-account" />
            <span class="text-body-2">{{ row.player }}</span>
            <v-chip size="x-small" label variant="tonal">#{{ showValue(row.number) }}</v-chip>
            <v-chip size="x-small" label variant="outlined">{{ showValue(row.position) }}</v-chip>
            <v-chip size="x-small" color="primary" label>{{ showValue(row.rating) }}</v-chip>
          </div>
        </td>
        <td>{{ showValue(row.minutes) }}</td>
        <td>{{ showValue(row.goals) }}</td>
        <td>{{ showValue(row.assists) }}</td>
      </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>
.players-table :deep(th),
.players-table :deep(td) {
  white-space: nowrap;
}

.player-row {
  min-height: 28px;
}
</style>
