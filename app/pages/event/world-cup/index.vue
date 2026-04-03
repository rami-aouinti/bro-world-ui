<script setup lang="ts">
import type {
  FifaWorldCupMatch,
  FifaWorldCupStanding,
  FifaWorldCupStadium,
  FifaWorldCupTeam,
} from '~/composables/fifa/useFifaWorldCup'
import { iso3ToIso2 } from '~/utils/countryCode'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})

const { getTeams, getStadiums, getGroupStandings, getMatches } = useFifaWorldCup()

const {
  data: teams,
  pending: teamsLoading,
  error: teamsError,
  refresh: refreshTeams,
} = useAsyncData<FifaWorldCupTeam[]>('fifa-world-cup-teams', () => getTeams({ fallbackOnError: false }), {
  default: () => [],
})

const {
  data: stadiums,
  pending: stadiumsLoading,
  error: stadiumsError,
  refresh: refreshStadiums,
} = useAsyncData<FifaWorldCupStadium[]>('fifa-world-cup-stadiums', () => getStadiums({ fallbackOnError: false }), {
  default: () => [],
})

const {
  data: standingsByGroup,
  pending: standingsLoading,
  error: standingsError,
  refresh: refreshStandings,
} = useAsyncData<Record<string, FifaWorldCupStanding[]>>(
  'fifa-world-cup-standings',
  () => getGroupStandings({ fallbackOnError: false }),
  {
    default: () => ({}),
  },
)

const {
  data: matches,
  pending: matchesLoading,
  error: matchesError,
  refresh: refreshMatches,
} = useAsyncData<FifaWorldCupMatch[]>('fifa-world-cup-matches', () => getMatches({ fallbackOnError: false }), {
  default: () => [],
})

const teamsByCode = computed(() => {
  return teams.value.reduce<Record<string, FifaWorldCupTeam>>((lookup, team) => {
    lookup[team.code] = team
    return lookup
  }, {})
})

const groupOptions = computed(() => {
  const groups = new Set<string>([
    ...teams.value.map(team => team.group),
    ...Object.keys(standingsByGroup.value),
    ...matches.value.map(match => match.group),
  ])

  return [...groups].sort((a, b) => a.localeCompare(b))
})

const imageLoadErrorByCode = ref<Record<string, boolean>>({})

const selectedStandingGroup = ref('')
const standingsSortKey = ref<'points' | 'diff' | 'matches'>('points')
const standingsSortDirection = ref<'asc' | 'desc'>('desc')

watchEffect(() => {
  if (!selectedStandingGroup.value || !groupOptions.value.includes(selectedStandingGroup.value)) {
    selectedStandingGroup.value = groupOptions.value[0] ?? ''
  }
})

const sortedSelectedGroupStandings = computed(() => {
  const rows = standingsByGroup.value[selectedStandingGroup.value] ?? []

  return [...rows].sort((a, b) => {
    const direction = standingsSortDirection.value === 'asc' ? 1 : -1
    const field = standingsSortKey.value

    if (a[field] === b[field]) {
      return a.teamCode.localeCompare(b.teamCode)
    }

    return (a[field] - b[field]) * direction
  })
})

const selectedMatchGroup = ref<'ALL' | string>('ALL')
const selectedMatchTeam = ref<'ALL' | string>('ALL')
const selectedMatchDate = ref<'ALL' | string>('ALL')

const matchTeamOptions = computed(() => {
  const uniqueTeamCodes = new Set<string>()

  for (const match of matches.value) {
    uniqueTeamCodes.add(match.teamA)
    uniqueTeamCodes.add(match.teamB)
  }

  return [...uniqueTeamCodes]
    .map(code => ({
      value: code,
      label: teamsByCode.value[code]?.name ?? code.toUpperCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const matchDateOptions = computed(() => {
  const dates = new Set(matches.value.map(match => match.datetime.slice(0, 10)))
  return [...dates].sort((a, b) => a.localeCompare(b))
})

const filteredMatches = computed(() => {
  return [...matches.value]
    .filter((match) => {
      const matchesGroup = selectedMatchGroup.value === 'ALL' || match.group === selectedMatchGroup.value
      const matchesTeam = selectedMatchTeam.value === 'ALL' || [match.teamA, match.teamB].includes(selectedMatchTeam.value)
      const matchesDate = selectedMatchDate.value === 'ALL' || match.datetime.startsWith(selectedMatchDate.value)

      return matchesGroup && matchesTeam && matchesDate
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
})

const toggleStandingsSort = (nextKey: 'points' | 'diff' | 'matches') => {
  if (standingsSortKey.value === nextKey) {
    standingsSortDirection.value = standingsSortDirection.value === 'desc' ? 'asc' : 'desc'
    return
  }

  standingsSortKey.value = nextKey
  standingsSortDirection.value = 'desc'
}

const renderSortLabel = (key: 'points' | 'diff' | 'matches') => {
  if (standingsSortKey.value !== key) {
    return ''
  }

  return standingsSortDirection.value === 'desc' ? '↓' : '↑'
}

const getFlagCountryCode = (countryCode: string): string | null => iso3ToIso2(countryCode)

const getFlagPath = (countryCode: string): string | null => {
  const iso2Code = getFlagCountryCode(countryCode)

  if (!iso2Code) {
    return null
  }

  return `/images/flags/${iso2Code}.svg`
}

const isFlagUnavailable = (countryCode: string) => {
  const iso2Code = getFlagCountryCode(countryCode)

  if (!iso2Code) {
    return true
  }

  return imageLoadErrorByCode.value[iso2Code] === true
}

const markFlagAsUnavailable = (countryCode: string) => {
  const iso2Code = getFlagCountryCode(countryCode)

  if (!iso2Code) {
    return
  }

  imageLoadErrorByCode.value[iso2Code] = true
}

const formatCapacity = (capacity: number | null): string => {
  if (capacity === null) {
    return 'N/A'
  }

  return new Intl.NumberFormat('fr-FR').format(capacity)
}

const formatMatchDate = (datetime: string) => {
  return new Date(datetime).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

const getTeamName = (code: string) => teamsByCode.value[code]?.name ?? code.toUpperCase()
</script>

<template>
  <NuxtLayout name="default">
    <main class="world-cup-page">
      <v-card class="pa-4 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 mb-0">All Stadiums</h2>
          <v-chip size="small" color="primary" variant="tonal">{{ stadiums.length }}</v-chip>
        </div>

        <v-progress-linear v-if="stadiumsLoading" indeterminate color="primary" class="mb-3" />

        <v-alert v-else-if="stadiumsError" type="error" variant="tonal" class="mb-2">
          Impossible de charger les stades.
          <template #append>
            <v-btn size="small" variant="text" @click="refreshStadiums">Réessayer</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!stadiums.length" type="info" variant="tonal">
          Aucun stade disponible.
        </v-alert>

        <v-table v-else density="compact" class="bg-transparent">
          <thead>
            <tr>
              <th class="text-left">Stadium</th>
              <th class="text-left">City</th>
              <th class="text-left">Country</th>
              <th class="text-right">Capacity</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stadium in stadiums" :key="stadium.id">
              <td>{{ stadium.name }}</td>
              <td>{{ stadium.city || 'N/A' }}</td>
              <td>{{ stadium.country || 'N/A' }}</td>
              <td class="text-right">{{ formatCapacity(stadium.capacity) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <v-card class="pa-4 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 mb-0">Group Standings</h2>
          <div class="selectors-grid">
            <v-select
              v-model="selectedStandingGroup"
              density="compact"
              hide-details
              variant="outlined"
              :items="groupOptions"
              label="Group"
              style="min-width: 140px"
            />
          </div>
        </div>

        <v-progress-linear v-if="standingsLoading || teamsLoading" indeterminate color="primary" class="mb-3" />

        <v-alert v-else-if="standingsError || teamsError" type="error" variant="tonal" class="mb-2">
          Impossible de charger les classements.
          <template #append>
            <v-btn size="small" variant="text" @click="() => { refreshStandings(); refreshTeams() }">Réessayer</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!groupOptions.length || !sortedSelectedGroupStandings.length" type="info" variant="tonal">
          Aucun classement disponible.
        </v-alert>

        <v-table v-else density="compact" class="bg-transparent">
          <thead>
            <tr>
              <th class="text-left">Équipe</th>
              <th class="text-right sortable-cell" @click="toggleStandingsSort('points')">
                Pts {{ renderSortLabel('points') }}
              </th>
              <th class="text-right sortable-cell" @click="toggleStandingsSort('diff')">
                Diff {{ renderSortLabel('diff') }}
              </th>
              <th class="text-right sortable-cell" @click="toggleStandingsSort('matches')">
                J {{ renderSortLabel('matches') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sortedSelectedGroupStandings" :key="row.teamCode">
              <td>
                <div class="d-flex align-center ga-2">
                  <template v-if="!isFlagUnavailable(row.teamCode)">
                    <v-avatar size="20" rounded="sm">
                      <v-img
                        :src="getFlagPath(row.teamCode)!"
                        :alt="`Drapeau ${getTeamName(row.teamCode)}`"
                        cover
                        @error="markFlagAsUnavailable(row.teamCode)"
                      />
                    </v-avatar>
                  </template>
                  <template v-else>
                    <v-avatar size="20" rounded="sm" class="flag-fallback-avatar">
                      <span class="flag-fallback-text">{{ row.teamCode.toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <span>{{ getTeamName(row.teamCode) }}</span>
                </div>
              </td>
              <td class="text-right">{{ row.points }}</td>
              <td class="text-right">{{ row.diff > 0 ? `+${row.diff}` : row.diff }}</td>
              <td class="text-right">{{ row.matches }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <v-card class="pa-4 section-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-3">
          <h2 class="text-h6 mb-0">All Matches</h2>
          <div class="selectors-grid">
            <v-select
              v-model="selectedMatchGroup"
              density="compact"
              hide-details
              variant="outlined"
              :items="['ALL', ...groupOptions]"
              label="Group"
              style="min-width: 140px"
            />
            <v-select
              v-model="selectedMatchTeam"
              density="compact"
              hide-details
              variant="outlined"
              :items="[{ value: 'ALL', label: 'All teams' }, ...matchTeamOptions]"
              item-title="label"
              item-value="value"
              label="Team"
              style="min-width: 190px"
            />
            <v-select
              v-model="selectedMatchDate"
              density="compact"
              hide-details
              variant="outlined"
              :items="['ALL', ...matchDateOptions]"
              label="Date"
              style="min-width: 150px"
            />
          </div>
        </div>

        <v-progress-linear v-if="matchesLoading || teamsLoading" indeterminate color="primary" class="mb-3" />

        <v-alert v-else-if="matchesError || teamsError" type="error" variant="tonal" class="mb-2">
          Impossible de charger les matchs.
          <template #append>
            <v-btn size="small" variant="text" @click="() => { refreshMatches(); refreshTeams() }">Réessayer</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!filteredMatches.length" type="info" variant="tonal">
          Aucun match trouvé avec ces filtres.
        </v-alert>

        <v-list v-else class="pa-0 bg-transparent" lines="two">
          <v-list-item v-for="match in filteredMatches" :key="`${match.group}-${match.datetime}-${match.teamA}-${match.teamB}`" class="px-0">
            <v-list-item-title class="d-flex align-center justify-space-between ga-2 flex-wrap">
              <span>{{ getTeamName(match.teamA) }} vs {{ getTeamName(match.teamB) }}</span>
              <v-chip size="x-small" color="primary" variant="outlined">Group {{ match.group }}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>{{ formatMatchDate(match.datetime) }} (UTC)</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.world-cup-page {
  display: grid;
  gap: 16px;
}

.section-card {
  border-radius: 16px;
}

.selectors-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sortable-cell {
  cursor: pointer;
  user-select: none;
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
