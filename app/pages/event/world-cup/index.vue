<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { FifaWorldCupTeam } from '~/composables/fifa/useFifaWorldCup'
import { iso3ToIso2 } from '~/utils/countryCode'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})

const { t, locale } = useI18n()
const { smAndDown } = useDisplay()
const fifaWorldCupStore = useFifaWorldCupStore()
const {
  teams,
  stadiums,
  standingsByGroup,
  matches,
  loading,
  error,
  lastUpdatedAt,
} = storeToRefs(fifaWorldCupStore)

const teamsLoading = computed(() => loading.value.teams)
const stadiumsLoading = computed(() => loading.value.stadiums)
const standingsLoading = computed(() => loading.value.standings)
const matchesLoading = computed(() => loading.value.matches)
const teamsError = computed(() => error.value.teams)
const stadiumsError = computed(() => error.value.stadiums)
const standingsError = computed(() => error.value.standings)
const matchesError = computed(() => error.value.matches)
const refreshTeams = () => fifaWorldCupStore.fetchTeams(true)
const refreshStadiums = () => fifaWorldCupStore.fetchStadiums(true)
const refreshStandings = () => fifaWorldCupStore.fetchStandings(true)
const refreshMatches = () => fifaWorldCupStore.fetchMatches(true)

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
const manualMatchesRefreshPending = ref(false)
const matchesLastUpdatedAt = ref<Date | null>(null)
let matchesPollingInterval: ReturnType<typeof setInterval> | null = null

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

const matchGroupOptions = computed(() => {
  return [
    { value: 'ALL', label: t('worldCup.filters.allGroups') },
    ...groupOptions.value.map(group => ({
      value: group,
      label: t('worldCup.filters.groupLabel', { group }),
    })),
  ]
})

const tableDensity = computed(() => (smAndDown.value ? 'comfortable' : 'compact'))
const sectionChipSize = computed(() => (smAndDown.value ? 'x-small' : 'small'))

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
    return t('worldCup.common.notAvailable')
  }

  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US').format(capacity)
}

const formatMatchDate = (datetime: string) => {
  return new Date(datetime).toLocaleString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

const getTeamName = (code: string) => teamsByCode.value[code]?.name ?? code.toUpperCase()

const formatLastUpdated = (date: Date | null) => {
  if (!date) {
    return t('worldCup.matches.neverUpdated')
  }

  return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

const refreshMatchesData = async (isManual = false) => {
  if (isManual) {
    manualMatchesRefreshPending.value = true
  }

  try {
    await Promise.all([refreshMatches(), refreshTeams()])
    matchesLastUpdatedAt.value = new Date()
  } finally {
    manualMatchesRefreshPending.value = false
  }
}

watch([matches, teams], () => {
  if (matches.value.length && teams.value.length && !matchesLoading.value && !teamsLoading.value) {
    matchesLastUpdatedAt.value = matchesLastUpdatedAt.value ?? new Date()
  }
})

onMounted(() => {
  void fifaWorldCupStore.fetchAll()
  if (lastUpdatedAt.value.matches) {
    matchesLastUpdatedAt.value = new Date(lastUpdatedAt.value.matches)
  }
  matchesPollingInterval = setInterval(() => refreshMatchesData(), 60000)
})

onBeforeUnmount(() => {
  if (matchesPollingInterval) {
    clearInterval(matchesPollingInterval)
  }
})
</script>

<template>
  <NuxtLayout name="default">
    <main class="world-cup-page" :aria-label="t('worldCup.pageLabel')">
      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="stadiums-title">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 id="stadiums-title" class="text-h6 mb-0">{{ t('worldCup.stadiums.title') }}</h2>
          <v-chip :size="sectionChipSize" color="primary" variant="outlined" class="section-chip">{{ stadiums.length }}</v-chip>
        </div>

        <div v-if="stadiumsLoading" class="mb-3">
          <v-skeleton-loader type="table-heading, table-row-divider@4" />
          <v-alert type="info" variant="tonal" class="mt-2">
            {{ t('worldCup.stadiums.status.loading') }}
          </v-alert>
        </div>

        <v-alert v-else-if="stadiumsError" type="error" variant="tonal" class="mb-2">
          {{ t('worldCup.stadiums.status.error') }}
          <template #append>
            <v-btn size="small" variant="text" @click="refreshStadiums">{{ t('worldCup.common.retry') }}</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!stadiums.length" type="info" variant="tonal">
          {{ t('worldCup.stadiums.status.empty') }}
        </v-alert>

        <v-table v-else :density="tableDensity" class="bg-transparent world-cup-table">
          <caption class="sr-only">{{ t('worldCup.stadiums.caption') }}</caption>
          <thead>
            <tr>
              <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.stadium') }}</th>
              <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.city') }}</th>
              <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.country') }}</th>
              <th scope="col" class="text-right">{{ t('worldCup.stadiums.columns.capacity') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stadium in stadiums" :key="stadium.id">
              <td>{{ stadium.name }}</td>
              <td>{{ stadium.city || t('worldCup.common.notAvailable') }}</td>
              <td>{{ stadium.country || t('worldCup.common.notAvailable') }}</td>
              <td class="text-right">{{ formatCapacity(stadium.capacity) }}</td>
            </tr>
          </tbody>
        </v-table>
        </section>
      </v-card>

      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="standings-title">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 id="standings-title" class="text-h6 mb-0">{{ t('worldCup.standings.title') }}</h2>
          <div class="selectors-grid">
            <v-select
              v-model="selectedStandingGroup"
              density="compact"
              hide-details
              variant="outlined"
              :items="groupOptions"
              :label="t('worldCup.filters.group')"
              style="min-width: 140px"
            />
          </div>
        </div>

        <div v-if="standingsLoading || teamsLoading" class="mb-3">
          <v-skeleton-loader type="table-heading, table-row-divider@4" />
          <v-alert type="info" variant="tonal" class="mt-2">
            {{ t('worldCup.standings.status.loading') }}
          </v-alert>
        </div>

        <v-alert v-else-if="standingsError || teamsError" type="error" variant="tonal" class="mb-2">
          {{ t('worldCup.standings.status.error') }}
          <template #append>
            <v-btn size="small" variant="text" @click="() => { refreshStandings(); refreshTeams() }">{{ t('worldCup.common.retry') }}</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!groupOptions.length || !sortedSelectedGroupStandings.length" type="info" variant="tonal">
          {{ t('worldCup.standings.status.empty') }}
        </v-alert>

        <v-table v-else :density="tableDensity" class="bg-transparent world-cup-table">
          <caption class="sr-only">{{ t('worldCup.standings.caption') }}</caption>
          <thead>
            <tr>
              <th scope="col" class="text-left">{{ t('worldCup.standings.columns.team') }}</th>
              <th scope="col" class="text-right">
                <button class="sort-button" type="button" @click="toggleStandingsSort('points')">
                  {{ t('worldCup.standings.columns.points') }} {{ renderSortLabel('points') }}
                </button>
              </th>
              <th scope="col" class="text-right">
                <button class="sort-button" type="button" @click="toggleStandingsSort('diff')">
                  {{ t('worldCup.standings.columns.diff') }} {{ renderSortLabel('diff') }}
                </button>
              </th>
              <th scope="col" class="text-right">
                <button class="sort-button" type="button" @click="toggleStandingsSort('matches')">
                  {{ t('worldCup.standings.columns.matches') }} {{ renderSortLabel('matches') }}
                </button>
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
                        :alt="t('worldCup.a11y.flagAlt', { team: getTeamName(row.teamCode) })"
                        cover
                        @error="markFlagAsUnavailable(row.teamCode)"
                      />
                    </v-avatar>
                  </template>
                  <template v-else>
                    <v-avatar size="20" rounded="sm" class="flag-fallback-avatar" :aria-label="t('worldCup.a11y.flagUnavailable')">
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
        </section>
      </v-card>

      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="matches-title">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-3">
          <div class="d-flex flex-column">
            <h2 id="matches-title" class="text-h6 mb-0">{{ t('worldCup.matches.title') }}</h2>
            <span class="text-caption text-medium-emphasis">
              {{ t('worldCup.matches.lastUpdated', { date: formatLastUpdated(matchesLastUpdatedAt) }) }}
            </span>
          </div>
          <div class="selectors-grid">
            <v-select
              v-model="selectedMatchGroup"
              density="compact"
              hide-details
              variant="outlined"
              :items="matchGroupOptions"
              item-title="label"
              item-value="value"
              :label="t('worldCup.filters.group')"
              style="min-width: 140px"
            />
            <v-select
              v-model="selectedMatchTeam"
              density="compact"
              hide-details
              variant="outlined"
              :items="[{ value: 'ALL', label: t('worldCup.filters.allTeams') }, ...matchTeamOptions]"
              item-title="label"
              item-value="value"
              :label="t('worldCup.filters.team')"
              style="min-width: 190px"
            />
            <v-select
              v-model="selectedMatchDate"
              density="compact"
              hide-details
              variant="outlined"
              :items="[{ value: 'ALL', label: t('worldCup.filters.allDates') }, ...matchDateOptions.map(date => ({ value: date, label: date }))]"
              item-title="label"
              item-value="value"
              :label="t('worldCup.filters.date')"
              style="min-width: 150px"
            />
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-refresh"
              :loading="manualMatchesRefreshPending"
              @click="refreshMatchesData(true)"
            >
              {{ t('worldCup.matches.refreshAction') }}
            </v-btn>
          </div>
        </div>

        <v-alert type="info" variant="tonal" density="compact" class="mb-3">
          {{ t('worldCup.matches.status.pollingHint') }}
        </v-alert>

        <div v-if="matchesLoading || teamsLoading" class="mb-3">
          <v-skeleton-loader type="list-item-avatar-two-line@4" />
          <v-alert type="info" variant="tonal" class="mt-2">
            {{ t('worldCup.matches.status.loading') }}
          </v-alert>
        </div>

        <v-alert v-else-if="matchesError || teamsError" type="error" variant="tonal" class="mb-2">
          {{ t('worldCup.matches.status.error') }}
          <template #append>
            <v-btn size="small" variant="text" @click="refreshMatchesData(true)">{{ t('worldCup.common.retry') }}</v-btn>
          </template>
        </v-alert>

        <v-alert v-else-if="!filteredMatches.length" type="info" variant="tonal">
          {{ t('worldCup.matches.status.empty') }}
        </v-alert>

        <v-list v-else class="pa-0 bg-transparent" lines="two">
          <v-list-item v-for="match in filteredMatches" :key="`${match.group}-${match.datetime}-${match.teamA}-${match.teamB}`" class="px-0">
            <v-list-item-title class="d-flex align-center justify-space-between ga-2 flex-wrap">
              <span>{{ getTeamName(match.teamA) }} {{ t('worldCup.matches.versus') }} {{ getTeamName(match.teamB) }}</span>
              <v-chip size="x-small" color="primary" variant="outlined">{{ t('worldCup.filters.groupLabel', { group: match.group }) }}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>{{ formatMatchDate(match.datetime) }} (UTC)</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        </section>
      </v-card>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.world-cup-page {
  display: grid;
  gap: 20px;
}

.section-card {
  border-radius: 16px;
}

.selectors-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(132px, auto));
  gap: 10px;
  align-items: center;
}

.sort-button {
  color: inherit;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  background: transparent;
  border: none;
  padding: 0;
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

.world-cup-table :deep(th),
.world-cup-table :deep(td) {
  white-space: nowrap;
}

.section-chip {
  font-weight: 700;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 959px) {
  .selectors-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .world-cup-page {
    gap: 16px;
  }
}

@media (max-width: 599px) {
  .selectors-grid {
    grid-template-columns: 1fr;
  }

  .world-cup-table :deep(th),
  .world-cup-table :deep(td) {
    font-size: 0.8rem;
  }
}
</style>
