<script setup lang="ts">
import type { FifaWorldCupStanding, FifaWorldCupTeam } from '~/composables/fifa/useFifaWorldCup'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: "card-grid",
});

type WorldCupGroup = {
  id: string
  teams: FifaWorldCupTeam[]
  standings: FifaWorldCupStanding[]
}

const { getTeams, getStadiums, getGroupStandings, getMatches } = useFifaWorldCup()

const { data: worldCupData } = await useAsyncData('fifa-world-cup-data', async () => {
  const [teams, stadiums, standingsByGroup, matches] = await Promise.all([
    getTeams(),
    getStadiums(),
    getGroupStandings(),
    getMatches(),
  ])

  return {
    teams,
    stadiums,
    standingsByGroup,
    matches,
  }
}, {
  default: () => ({
    teams: [],
    stadiums: [],
    standingsByGroup: {},
    matches: [],
  }),
})

const groupsWithStandings = computed<WorldCupGroup[]>(() => {
  const groupedTeams = worldCupData.value.teams.reduce<Record<string, FifaWorldCupTeam[]>>((lookup, team) => {
    lookup[team.group] = [...(lookup[team.group] ?? []), team]
    return lookup
  }, {})

  const availableGroups = new Set([
    ...Object.keys(groupedTeams),
    ...Object.keys(worldCupData.value.standingsByGroup),
  ])

  return [...availableGroups]
    .sort((a, b) => a.localeCompare(b))
    .map(groupId => ({
      id: groupId,
      teams: groupedTeams[groupId] ?? [],
      standings: worldCupData.value.standingsByGroup[groupId] ?? [],
    }))
})

const teamsByCode = computed(() => {
  return worldCupData.value.teams.reduce<Record<string, FifaWorldCupTeam>>((lookup, team) => {
    lookup[team.code] = team
    return lookup
  }, {})
})

const imageLoadErrorByCode = ref<Record<string, boolean>>({})

const getFlagPath = (countryCode: string) => {
  return `/images/flags/${countryCode}.svg`
}

const isFlagUnavailable = (countryCode: string) => {
  return !getFlagPath(countryCode) || imageLoadErrorByCode.value[countryCode] === true
}

const markFlagAsUnavailable = (countryCode: string) => {
  imageLoadErrorByCode.value[countryCode] = true
}

const renderCountryCode = (countryCode: string) => countryCode.toUpperCase()

const getTeam = (code: string) => teamsByCode.value[code]

const formatMatchDate = (datetime: string) => {
  return new Date(datetime).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}
</script>

<template>
  <NuxtLayout name="default">
    <template #layout-sidebar>
      <div class="d-flex align-center justify-space-between mb-3">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Pays qualifiés</h2>
        <v-chip size="small" color="primary" variant="tonal">{{ worldCupData.teams.length }}</v-chip>
      </div>
      <div class="group-list">
        <section v-for="group in groupsWithStandings" :key="group.id" class="group-section">
          <div class="d-flex align-center justify-space-between mb-2">
            <h3 class="text-body-2 font-weight-bold mb-0">Groupe {{ group.id }}</h3>
            <v-chip size="x-small" color="primary" variant="outlined">{{ group.teams.length }}</v-chip>
          </div>

          <v-list density="compact" class="pa-0 bg-transparent">
            <v-list-item v-for="team in group.teams" :key="team.code" class="px-0">
              <template #prepend>
                <template v-if="!isFlagUnavailable(team.code)">
                  <v-avatar size="24" rounded="sm" class="me-2">
                    <v-img
                        :src="getFlagPath(team.code)!"
                        :alt="`Drapeau ${team.name}`"
                        cover
                        @error="markFlagAsUnavailable(team.code)"
                    />
                  </v-avatar>
                </template>
                <template v-else>
                  <v-avatar size="24" rounded="sm" class="me-2 flag-fallback-avatar">
                    <span class="flag-fallback-text">{{ renderCountryCode(team.code) }}</span>
                  </v-avatar>
                </template>
              </template>

              <v-list-item-title class="text-body-2">{{ team.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </section>
      </div>
    </template>
    <template #layout-aside>
      <div class="d-flex align-center justify-space-between mb-3">
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Premiers matchs à jouer</h2>
        <v-chip size="small" color="primary" variant="tonal">{{ worldCupData.matches.length }}</v-chip>
      </div>

      <v-list class="pa-0 bg-transparent match-list" lines="two">
        <v-list-item v-for="match in worldCupData.matches" :key="`${match.group}-${match.datetime}`" class="px-0">
          <v-list-item-title class="d-flex align-center justify-space-between ga-2">
            <span>{{ getTeam(match.teamA)?.name ?? match.teamA }} vs {{ getTeam(match.teamB)?.name ?? match.teamB }}</span>
            <v-chip size="x-small" color="primary" variant="outlined">Groupe {{ match.group }}</v-chip>
          </v-list-item-title>
          <v-list-item-subtitle>{{ formatMatchDate(match.datetime) }} (UTC)</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </template>
    <main>
      <v-row class="groups-grid">
        <v-col v-for="group in groupsWithStandings" :key="group.id" cols="12" md="6" xl="4">
          <v-card class="pa-4 group-card" variant="tonal">
            <div class="d-flex align-center justify-space-between mb-3">
              <h3 class="text-subtitle-2 font-weight-bold mb-0">Classement — Groupe {{ group.id }}</h3>
              <v-chip size="x-small" color="primary" variant="outlined">4 équipes</v-chip>
            </div>

            <v-table density="compact" class="bg-transparent standings-table">
              <thead>
              <tr>
                <th class="text-left">Équipe</th>
                <th class="text-right">Pts</th>
                <th class="text-right">Diff</th>
                <th class="text-right">J</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="row in group.standings" :key="row.teamCode">
                <td>
                  <div class="d-flex align-center ga-2">
                    <template v-if="!isFlagUnavailable(row.teamCode)">
                      <v-avatar size="20" rounded="sm">
                        <v-img
                            :src="getFlagPath(row.teamCode)!"
                            :alt="`Drapeau ${getTeam(row.teamCode)?.name ?? row.teamCode}`"
                            cover
                            @error="markFlagAsUnavailable(row.teamCode)"
                        />
                      </v-avatar>
                    </template>
                    <template v-else>
                      <v-avatar size="20" rounded="sm" class="flag-fallback-avatar">
                        <span class="flag-fallback-text">{{ renderCountryCode(row.teamCode) }}</span>
                      </v-avatar>
                    </template>
                    <span>{{ getTeam(row.teamCode)?.name ?? row.teamCode }}</span>
                  </div>
                </td>
                <td class="text-right">{{ row.points }}</td>
                <td class="text-right">{{ row.diff > 0 ? `+${row.diff}` : row.diff }}</td>
                <td class="text-right">{{ row.matches }}</td>
              </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.world-cup-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 320px);
  gap: 1rem;
  align-items: start;
  padding: 1.25rem;
}

.world-cup-layout__sidebar,
.world-cup-layout__aside {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

@media (max-width: 1120px) {
  .world-cup-layout {
    grid-template-columns: 1fr;
  }

  .world-cup-layout__sidebar,
  .world-cup-layout__aside {
    position: static;
    max-height: none;
    overflow: visible;
  }
}

.sidebar-card,
.group-card,
.upcoming-card {
  border-radius: 16px;
}

.group-section + .group-section {
  margin-top: 12px;
}

.groups-grid {
  row-gap: 8px;
}

.standings-table {
  margin-top: 4px;
}

.match-list :deep(.v-list-item + .v-list-item) {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.flag-fallback-avatar {
  background: rgba(var(--v-theme-primary), 0.16);
  border: 1px solid rgba(var(--v-theme-primary), 0.32);
}

.flag-fallback-text {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
