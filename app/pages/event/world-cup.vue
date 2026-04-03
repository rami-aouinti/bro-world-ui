<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'

type Team = {
  name: string
  code: string
}

type StandingRow = {
  teamCode: string
  points: number
  diff: number
  matches: number
}

type Group = {
  id: string
  teams: Team[]
  standings: StandingRow[]
}

type UpcomingMatch = {
  datetime: string
  teamA: string
  teamB: string
  group: string
}

const worldCupGroups: Group[] = [
  {
    id: 'A',
    teams: [
      { name: 'United States', code: 'us' },
      { name: 'Mexico', code: 'mx' },
      { name: 'Costa Rica', code: 'cr' },
      { name: 'Qatar', code: 'qa' },
    ],
    standings: [
      { teamCode: 'us', points: 7, diff: 5, matches: 3 },
      { teamCode: 'mx', points: 5, diff: 2, matches: 3 },
      { teamCode: 'cr', points: 3, diff: -1, matches: 3 },
      { teamCode: 'qa', points: 1, diff: -6, matches: 3 },
    ],
  },
  {
    id: 'B',
    teams: [
      { name: 'Brazil', code: 'br' },
      { name: 'Nigeria', code: 'ng' },
      { name: 'Japan', code: 'jp' },
      { name: 'Serbia', code: 'rs' },
    ],
    standings: [
      { teamCode: 'br', points: 9, diff: 7, matches: 3 },
      { teamCode: 'jp', points: 4, diff: 0, matches: 3 },
      { teamCode: 'ng', points: 2, diff: -2, matches: 3 },
      { teamCode: 'rs', points: 1, diff: -5, matches: 3 },
    ],
  },
  {
    id: 'C',
    teams: [
      { name: 'France', code: 'fr' },
      { name: 'Canada', code: 'ca' },
      { name: 'Morocco', code: 'ma' },
      { name: 'South Korea', code: 'kr' },
    ],
    standings: [
      { teamCode: 'fr', points: 6, diff: 4, matches: 3 },
      { teamCode: 'ma', points: 6, diff: 3, matches: 3 },
      { teamCode: 'ca', points: 3, diff: -1, matches: 3 },
      { teamCode: 'kr', points: 1, diff: -6, matches: 3 },
    ],
  },
  {
    id: 'D',
    teams: [
      { name: 'Argentina', code: 'ar' },
      { name: 'Sweden', code: 'se' },
      { name: 'Egypt', code: 'eg' },
      { name: 'Australia', code: 'au' },
    ],
    standings: [
      { teamCode: 'ar', points: 7, diff: 6, matches: 3 },
      { teamCode: 'se', points: 5, diff: 1, matches: 3 },
      { teamCode: 'au', points: 2, diff: -2, matches: 3 },
      { teamCode: 'eg', points: 1, diff: -5, matches: 3 },
    ],
  },
  {
    id: 'E',
    teams: [
      { name: 'Spain', code: 'es' },
      { name: 'United Arab Emirates', code: 'ae' },
      { name: 'Colombia', code: 'co' },
      { name: 'Algeria', code: 'dz' },
    ],
    standings: [
      { teamCode: 'es', points: 7, diff: 5, matches: 3 },
      { teamCode: 'co', points: 6, diff: 2, matches: 3 },
      { teamCode: 'ae', points: 3, diff: -1, matches: 3 },
      { teamCode: 'dz', points: 1, diff: -6, matches: 3 },
    ],
  },
  {
    id: 'F',
    teams: [
      { name: 'Germany', code: 'de' },
      { name: 'Tunisia', code: 'tn' },
      { name: 'United States Virgin Islands', code: 'vi' },
      { name: 'Ghana', code: 'gh' },
    ],
    standings: [
      { teamCode: 'de', points: 8, diff: 4, matches: 3 },
      { teamCode: 'gh', points: 4, diff: 1, matches: 3 },
      { teamCode: 'tn', points: 3, diff: -1, matches: 3 },
      { teamCode: 'vi', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'G',
    teams: [
      { name: 'England', code: 'gb' },
      { name: 'Senegal', code: 'sn' },
      { name: 'Ecuador', code: 'ec' },
      { name: 'Iraq', code: 'iq' },
    ],
    standings: [
      { teamCode: 'gb', points: 7, diff: 3, matches: 3 },
      { teamCode: 'sn', points: 6, diff: 2, matches: 3 },
      { teamCode: 'ec', points: 3, diff: -1, matches: 3 },
      { teamCode: 'iq', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'H',
    teams: [
      { name: 'Netherlands', code: 'nl' },
      { name: 'Cameroon', code: 'cm' },
      { name: 'Peru', code: 'pe' },
      { name: 'Ukraine', code: 'ua' },
    ],
    standings: [
      { teamCode: 'nl', points: 9, diff: 6, matches: 3 },
      { teamCode: 'ua', points: 4, diff: 0, matches: 3 },
      { teamCode: 'pe', points: 3, diff: -2, matches: 3 },
      { teamCode: 'cm', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'I',
    teams: [
      { name: 'Portugal', code: 'pt' },
      { name: 'Saudi Arabia', code: 'sa' },
      { name: 'Chile', code: 'cl' },
      { name: 'Bolivia', code: 'bo' },
    ],
    standings: [
      { teamCode: 'pt', points: 7, diff: 4, matches: 3 },
      { teamCode: 'cl', points: 5, diff: 1, matches: 3 },
      { teamCode: 'sa', points: 3, diff: -1, matches: 3 },
      { teamCode: 'bo', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'J',
    teams: [
      { name: 'Italy', code: 'it' },
      { name: 'Iran', code: 'ir' },
      { name: 'Paraguay', code: 'py' },
      { name: 'Côte d\'Ivoire', code: 'ci' },
    ],
    standings: [
      { teamCode: 'it', points: 6, diff: 3, matches: 3 },
      { teamCode: 'ir', points: 6, diff: 2, matches: 3 },
      { teamCode: 'ci', points: 3, diff: -1, matches: 3 },
      { teamCode: 'py', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'K',
    teams: [
      { name: 'Belgium', code: 'be' },
      { name: 'Poland', code: 'pl' },
      { name: 'Uruguay', code: 'uy' },
      { name: 'South Africa', code: 'za' },
    ],
    standings: [
      { teamCode: 'be', points: 8, diff: 5, matches: 3 },
      { teamCode: 'pl', points: 4, diff: 0, matches: 3 },
      { teamCode: 'uy', points: 3, diff: -1, matches: 3 },
      { teamCode: 'za', points: 1, diff: -4, matches: 3 },
    ],
  },
  {
    id: 'L',
    teams: [
      { name: 'Croatia', code: 'hr' },
      { name: 'Denmark', code: 'dk' },
      { name: 'Turkey', code: 'tr' },
      { name: 'New Zealand', code: 'nz' },
    ],
    standings: [
      { teamCode: 'hr', points: 7, diff: 3, matches: 3 },
      { teamCode: 'dk', points: 5, diff: 1, matches: 3 },
      { teamCode: 'tr', points: 3, diff: -1, matches: 3 },
      { teamCode: 'nz', points: 1, diff: -3, matches: 3 },
    ],
  },
]

const upcomingMatches: UpcomingMatch[] = [
  { datetime: '2026-06-15T13:00:00Z', teamA: 'us', teamB: 'mx', group: 'A' },
  { datetime: '2026-06-15T16:00:00Z', teamA: 'br', teamB: 'jp', group: 'B' },
  { datetime: '2026-06-15T19:00:00Z', teamA: 'fr', teamB: 'ma', group: 'C' },
  { datetime: '2026-06-16T13:00:00Z', teamA: 'ar', teamB: 'se', group: 'D' },
  { datetime: '2026-06-16T16:00:00Z', teamA: 'es', teamB: 'co', group: 'E' },
  { datetime: '2026-06-16T19:00:00Z', teamA: 'de', teamB: 'gh', group: 'F' },
  { datetime: '2026-06-17T13:00:00Z', teamA: 'gb', teamB: 'sn', group: 'G' },
  { datetime: '2026-06-17T16:00:00Z', teamA: 'nl', teamB: 'ua', group: 'H' },
  { datetime: '2026-06-17T19:00:00Z', teamA: 'pt', teamB: 'cl', group: 'I' },
  { datetime: '2026-06-18T13:00:00Z', teamA: 'it', teamB: 'ir', group: 'J' },
  { datetime: '2026-06-18T16:00:00Z', teamA: 'be', teamB: 'pl', group: 'K' },
  { datetime: '2026-06-18T19:00:00Z', teamA: 'hr', teamB: 'dk', group: 'L' },
]

const teamsByCode = computed(() => {
  return worldCupGroups.reduce<Record<string, Team>>((lookup, group) => {
    group.teams.forEach((team) => {
      lookup[team.code] = team
    })

    return lookup
  }, {})
})

const sortedUpcomingMatches = computed(() => {
  return [...upcomingMatches].sort((a, b) => a.datetime.localeCompare(b.datetime))
})

const FLAG_FILE_BY_COUNTRY_CODE: Record<string, string> = {
  ae: 'ae.svg',
  ar: 'ar.svg',
  au: 'au.svg',
  be: 'be.svg',
  bo: 'bo.svg',
  br: 'br.svg',
  ca: 'ca.svg',
  ci: 'ci.svg',
  cl: 'cl.svg',
  cm: 'cm.svg',
  co: 'co.svg',
  cr: 'cr.svg',
  de: 'de.svg',
  dk: 'dk.svg',
  dz: 'dz.svg',
  ec: 'ec.svg',
  eg: 'eg.svg',
  es: 'es.svg',
  fr: 'fr.svg',
  gb: 'gb.svg',
  gh: 'gh.svg',
  hr: 'hr.svg',
  iq: 'iq.svg',
  ir: 'ir.svg',
  it: 'it.svg',
  jp: 'jp.svg',
  kr: 'kr.svg',
  ma: 'ma.svg',
  mx: 'mx.svg',
  ng: 'ng.svg',
  nl: 'nl.svg',
  nz: 'nz.svg',
  pe: 'pe.svg',
  pl: 'pl.svg',
  pt: 'pt.svg',
  py: 'py.svg',
  qa: 'qa.svg',
  rs: 'rs.svg',
  sa: 'sa.svg',
  se: 'se.svg',
  sn: 'sn.svg',
  tn: 'tn.svg',
  tr: 'tr.svg',
  ua: 'ua.svg',
  us: 'us.svg',
  uy: 'uy.svg',
  vi: 'vi.svg',
  za: 'za.svg',
}

const imageLoadErrorByCode = ref<Record<string, boolean>>({})

const getFlagPath = (countryCode: string) => {
  const file = FLAG_FILE_BY_COUNTRY_CODE[countryCode]
  return file ? `/images/flags/${file}` : null
}

const isFlagUnavailable = (countryCode: string) => {
  return !getFlagPath(countryCode) || imageLoadErrorByCode.value[countryCode] === true
}

const markFlagAsUnavailable = (countryCode: string) => {
  imageLoadErrorByCode.value[countryCode] = true
}

const renderCountryCode = (countryCode: string) => countryCode.toUpperCase()

const missingFlagMappings = computed(() => {
  return worldCupGroups.flatMap((group) =>
    group.teams
      .filter((team) => !FLAG_FILE_BY_COUNTRY_CODE[team.code])
      .map((team) => team.code),
  )
})

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
  <PlatformSplitLayout>
    <template #sidebar>
      <v-card class="pa-4 sidebar-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-bold mb-0">Pays qualifiés</h2>
          <v-chip size="small" color="primary" variant="tonal">48</v-chip>
        </div>
        <v-alert
          v-if="missingFlagMappings.length"
          density="compact"
          type="warning"
          variant="tonal"
          class="mb-3"
        >
          Drapeaux manquants: {{ missingFlagMappings.join(', ').toUpperCase() }}
        </v-alert>

        <div class="group-list">
          <section v-for="group in worldCupGroups" :key="group.id" class="group-section">
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
      </v-card>
    </template>

    <v-row class="groups-grid">
      <v-col v-for="group in worldCupGroups" :key="group.id" cols="12" md="6" xl="4">
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

    <template #aside>
      <v-card class="pa-4 upcoming-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-bold mb-0">Premiers matchs à jouer</h2>
          <v-chip size="small" color="primary" variant="tonal">{{ sortedUpcomingMatches.length }}</v-chip>
        </div>

        <v-list class="pa-0 bg-transparent match-list" lines="two">
          <v-list-item v-for="match in sortedUpcomingMatches" :key="`${match.group}-${match.datetime}`" class="px-0">
            <v-list-item-title class="d-flex align-center justify-space-between ga-2">
              <span>{{ getTeam(match.teamA)?.name ?? match.teamA }} vs {{ getTeam(match.teamB)?.name ?? match.teamB }}</span>
              <v-chip size="x-small" color="primary" variant="outlined">Groupe {{ match.group }}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>{{ formatMatchDate(match.datetime) }} (UTC)</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </PlatformSplitLayout>
</template>

<style scoped>
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
