<script setup lang="ts">
import { computed, ref } from 'vue'
import { getSportContext } from '~/components/sport/sportContext'
import type { SportTeamItem } from '~/components/sport/types'

definePageMeta({
  public: true,
  requiresAuth: false,
})

type ApiSportsTeamsResponse = {
  response?: Array<{
    team?: {
      id?: number
      name?: string
      logo?: string
      code?: string
      country?: string
      founded?: number
      national?: boolean
    }
    venue?: {
      name?: string
      city?: string
      address?: string
      capacity?: number
      surface?: string
      image?: string
    }
  }>
}

const route = useRoute()
const { t, te } = useI18n()

const sportSlug = computed(() => String(route.params.sport ?? 'sport'))
const sport = computed(() => getSportContext(sportSlug.value, t, te))
const selectedTeamId = ref<string | null>(null)

const normalizeTeams = (payload: ApiSportsTeamsResponse | null | undefined): SportTeamItem[] => {
  return (payload?.response || [])
    .map((entry) => {
      const teamId = entry.team?.id

      if (!teamId) {
        return null
      }

      return {
        id: String(teamId),
        name: entry.team?.name || 'Unknown team',
        logo: entry.team?.logo || '',
        code: entry.team?.code || '',
        country: entry.team?.country || '',
        founded: entry.team?.founded ?? null,
        national: Boolean(entry.team?.national),
        venue: {
          name: entry.venue?.name || '',
          city: entry.venue?.city || '',
          address: entry.venue?.address || '',
          capacity: entry.venue?.capacity ?? null,
          surface: entry.venue?.surface || '',
          image: entry.venue?.image || '',
        },
      }
    })
    .filter((team): team is SportTeamItem => Boolean(team))
}

const { data, pending, error, refresh } = await useAsyncData(
  () => `sport-teams-${sportSlug.value}`,
  () => $fetch<ApiSportsTeamsResponse>(`/api/apisports/${sportSlug.value}/teams`),
  {
    server: true,
    default: () => ({ response: [] }),
  },
)

const teams = computed(() => normalizeTeams(data.value))

const selectedTeam = computed(() => {
  if (!selectedTeamId.value) {
    return null
  }

  return teams.value.find(team => team.id === selectedTeamId.value) || null
})

const onSelectTeam = (teamId: string) => {
  selectedTeamId.value = teamId
}
</script>

<template>
  <UiPageShell :title="sport.label" :description="t('app.navigation.sport')">
    <div class="d-flex flex-column ga-4 ga-md-6">
      <SportSegmentedNav
        :sport-slug="sport.slug"
        active-section="teams"
      />

      <div class="sport-dashboard">
        <main class="sport-dashboard__center">
          <v-card variant="tonal" class="pa-4">
            <UiLoadingState
              v-if="pending"
              variant="cards"
              :cards="3"
              message="Loading teams..."
            />

            <template v-else-if="error">
              <UiStateAlert type="error" class="mb-4">
                Unable to load teams.
              </UiStateAlert>
              <v-btn color="primary" variant="flat" @click="refresh()">
                {{ t('sport.retry') }}
              </v-btn>
            </template>

            <UiEmptyState
              v-else-if="teams.length === 0"
              title="No teams available"
              description="Try another sport or refresh the page."
              icon="mdi-account-group-outline"
            >
              <template #action>
                <v-btn color="primary" variant="flat" @click="refresh()">
                  {{ t('sport.retry') }}
                </v-btn>
              </template>
            </UiEmptyState>

            <SportTeamsList
              v-else
              :teams="teams"
              :selected-team-id="selectedTeamId"
              @select="onSelectTeam"
            />
          </v-card>
        </main>

        <aside class="sport-dashboard__right">
          <SportTeamPanel :team="selectedTeam" />
        </aside>
      </div>
    </div>
  </UiPageShell>
</template>

<style scoped>
.sport-dashboard {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  align-items: start;
}

.sport-dashboard__right {
  position: sticky;
  top: 16px;
}

@media (max-width: 960px) {
  .sport-dashboard {
    grid-template-columns: 1fr;
  }

  .sport-dashboard__right {
    position: static;
  }
}
</style>
