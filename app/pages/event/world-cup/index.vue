<script setup lang="ts">
import AppSplitShell from '~/components/layout/AppSplitShell.vue'
import {
  worldCupGroups,
  worldCupStandings,
  worldCupUpcomingMatches,
  type WorldCupCountry,
} from '~/data/world-cup'

definePageMeta({
  public: true,
  requiresAuth: false,
  skeleton: "card-grid",
});

type WorldCupGroup = {
  id: string
  teams: WorldCupCountry[]
  standings: (typeof worldCupStandings)[string]
}

const groupsWithStandings = computed<WorldCupGroup[]>(() => {
  return Object.entries(worldCupGroups).map(([id, teams]) => ({
    id,
    teams,
    standings: worldCupStandings[id] ?? [],
  }))
})

const teamsByCode = computed(() => {
  return groupsWithStandings.value.reduce<Record<string, WorldCupCountry>>((lookup, group) => {
    group.teams.forEach((team) => {
      lookup[team.code] = team
    })

    return lookup
  }, {})
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
  return groupsWithStandings.value.flatMap((group) =>
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
  <AppSplitShell>
    <template #left>
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
      </v-card>
    </template>

    <template #default>
      <section>
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
      </section>
    </template>

    <template #aside>
      <v-card class="pa-4 upcoming-card" variant="tonal">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-bold mb-0">Premiers matchs à jouer</h2>
          <v-chip size="small" color="primary" variant="tonal">{{ worldCupUpcomingMatches.length }}</v-chip>
        </div>

        <v-list class="pa-0 bg-transparent match-list" lines="two">
          <v-list-item v-for="match in worldCupUpcomingMatches" :key="`${match.group}-${match.datetime}`" class="px-0">
            <v-list-item-title class="d-flex align-center justify-space-between ga-2">
              <span>{{ getTeam(match.teamA)?.name ?? match.teamA }} vs {{ getTeam(match.teamB)?.name ?? match.teamB }}</span>
              <v-chip size="x-small" color="primary" variant="outlined">Groupe {{ match.group }}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>{{ formatMatchDate(match.datetime) }} (UTC)</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </AppSplitShell>
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
