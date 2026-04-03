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
const { teams, stadiums, loading, error } = storeToRefs(fifaWorldCupStore)

const teamsLoading = computed(() => loading.value.teams)
const stadiumsLoading = computed(() => loading.value.stadiums)
const teamsError = computed(() => error.value.teams)
const stadiumsError = computed(() => error.value.stadiums)

const tableDensity = computed(() => (smAndDown.value ? 'comfortable' : 'compact'))
const sectionChipSize = computed(() => (smAndDown.value ? 'x-small' : 'small'))

const imageLoadErrorByCode = ref<Record<string, boolean>>({})

const refreshTeams = () => fifaWorldCupStore.fetchTeams(true)
const refreshStadiums = () => fifaWorldCupStore.fetchStadiums(true)

const formatCapacity = (capacity: number | null): string => {
  if (capacity === null) {
    return t('worldCup.common.notAvailable')
  }

  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US').format(capacity)
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

onMounted(() => {
  void fifaWorldCupStore.fetchAll()
})
</script>

<template>
  <NuxtLayout name="default">
    <main class="world-cup-page" :aria-label="t('worldCup.pageLabel')">
      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="teams-title">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 id="teams-title" class="text-h6 mb-0">{{ t('worldCup.teams.title') }}</h2>
            <v-chip :size="sectionChipSize" color="primary" variant="outlined" class="section-chip">{{ teams.length }}</v-chip>
          </div>

          <div v-if="teamsLoading" class="mb-3">
            <v-skeleton-loader type="table-heading, table-row-divider@6" />
          </div>

          <v-alert v-else-if="teamsError" type="error" variant="tonal" class="mb-2">
            {{ t('worldCup.teams.status.error') }}
            <template #append>
              <v-btn size="small" variant="text" @click="refreshTeams">{{ t('worldCup.common.retry') }}</v-btn>
            </template>
          </v-alert>

          <v-alert v-else-if="!teams.length" type="info" variant="tonal">
            {{ t('worldCup.teams.status.empty') }}
          </v-alert>

          <v-table v-else :density="tableDensity" class="bg-transparent world-cup-table">
            <caption class="sr-only">{{ t('worldCup.teams.caption') }}</caption>
            <thead>
              <tr>
                <th scope="col" class="text-left">{{ t('worldCup.teams.columns.team') }}</th>
                <th scope="col" class="text-left">{{ t('worldCup.teams.columns.code') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in teams" :key="team.code">
                <td>
                  <div class="d-flex align-center ga-2">
                    <template v-if="!isFlagUnavailable(team.code)">
                      <v-avatar size="20" rounded="sm">
                        <v-img
                          :src="getFlagPath(team.code)!"
                          :alt="t('worldCup.a11y.flagAlt', { team: team.name })"
                          cover
                          @error="markFlagAsUnavailable(team.code)"
                        />
                      </v-avatar>
                    </template>
                    <template v-else>
                      <v-avatar size="20" rounded="sm" class="flag-fallback-avatar" :aria-label="t('worldCup.a11y.flagUnavailable')">
                        <span class="flag-fallback-text">{{ team.code.toUpperCase() }}</span>
                      </v-avatar>
                    </template>
                    <span>{{ team.name }}</span>
                  </div>
                </td>
                <td>{{ team.code.toUpperCase() }}</td>
              </tr>
            </tbody>
          </v-table>
        </section>
      </v-card>

      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="stadiums-title">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 id="stadiums-title" class="text-h6 mb-0">{{ t('worldCup.stadiums.title') }}</h2>
            <v-chip :size="sectionChipSize" color="primary" variant="outlined" class="section-chip">{{ stadiums.length }}</v-chip>
          </div>

          <div v-if="stadiumsLoading" class="mb-3">
            <v-skeleton-loader type="table-heading, table-row-divider@6" />
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

@media (max-width: 599px) {
  .world-cup-table :deep(th),
  .world-cup-table :deep(td) {
    font-size: 0.8rem;
  }
}
</style>
