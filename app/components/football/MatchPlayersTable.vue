<script setup lang="ts">
import FootballAvatar from './FootballAvatar.vue'
import type { MatchPlayersByTeam } from './types'

const props = defineProps<{
  players: MatchPlayersByTeam[]
}>()

const placeholder = '—'
const playersSubTab = ref('teams')

const teamsWithPlayers = computed(() => {
  return (props.players || []).map((teamBlock, index) => {
    const teamName = teamBlock?.team?.name || placeholder
    const teamKey = String(teamBlock?.team?.id || `${teamName}-${index}`)

    const players = (teamBlock?.players || []).map((player, playerIndex) => {
      const stats = player?.statistics?.[0]

      return {
        key: `${teamKey}-${player?.player?.id || player?.player?.name || playerIndex}`,
        player: player?.player?.name || placeholder,
        photo: player?.player?.photo,
        number: player?.player?.number,
        position: stats?.games?.position,
        rating: stats?.games?.rating,
        minutes: stats?.games?.minutes,
        goals: stats?.goals?.total,
        assists: stats?.goals?.assists,
      }
    })

    return {
      key: teamKey,
      name: teamName,
      players,
    }
  })
})

const totalPlayers = computed(() => teamsWithPlayers.value.reduce((total, team) => total + team.players.length, 0))

const showValue = (value: string | number | null | undefined) => value ?? placeholder
</script>

<template>
  <div class="pa-3">
    <v-alert v-if="!teamsWithPlayers.length" type="info" variant="tonal" density="comfortable">
      Aucune statistique joueur disponible.
    </v-alert>

    <template v-else>
      <v-tabs v-model="playersSubTab" color="primary" density="comfortable" class="mb-3">
        <v-tab
          v-for="team in teamsWithPlayers"
          :key="team.key"
          :value="team.key"
        >
          {{ team.name }}
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="playersSubTab">

        <v-tabs-window-item
          v-for="team in teamsWithPlayers"
          :key="`pane-${team.key}`"
          :value="team.key"
        >
          <v-table density="compact" class="bg-transparent players-table">
            <thead>
            <tr>
              <th>Player</th>
              <th>Min</th>
              <th>Buts</th>
              <th>Passes</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="!team.players.length">
              <td colspan="4" class="text-medium-emphasis">Aucune statistique joueur disponible.</td>
            </tr>
            <tr v-for="row in team.players" :key="row.key">
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
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
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
