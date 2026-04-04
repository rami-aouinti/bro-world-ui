export type SportDashboardSelection = {
  gameId: string | null
  leagueId: string | null
  homeTeamId: string | null
  awayTeamId: string | null
  teamId: string | null
  season: number | null
}

const createDefaultSelection = (): SportDashboardSelection => ({
  gameId: null,
  leagueId: null,
  homeTeamId: null,
  awayTeamId: null,
  teamId: null,
  season: null,
})

export const useSportDashboardStore = defineStore('sportDashboard', () => {
  const bySport = ref<Record<string, SportDashboardSelection>>({})

  const ensureSportSelection = (sport: string): SportDashboardSelection => {
    if (!bySport.value[sport]) {
      bySport.value[sport] = createDefaultSelection()
    }

    return bySport.value[sport]
  }

  const setSelection = (sport: string, patch: Partial<SportDashboardSelection>) => {
    const current = ensureSportSelection(sport)
    bySport.value[sport] = {
      ...current,
      ...patch,
    }
    return bySport.value[sport]
  }

  return {
    bySport,
    ensureSportSelection,
    setSelection,
  }
})
