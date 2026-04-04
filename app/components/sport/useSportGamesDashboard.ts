import { computed, ref, watch, type Ref } from 'vue'
import type { SportGameCardItem } from './types'
import { useSportDashboardStore } from '~/stores/sportDashboard'

export type SportRightPanelTab = 'game' | 'team' | 'standings'

export function useSportGamesDashboard(options: {
  sport: Ref<string>
  games: Ref<SportGameCardItem[]>
  initialDate?: string
}) {
  const dashboardStore = useSportDashboardStore()

  const league = ref('all')
  const status = ref('all')
  const date = ref(options.initialDate || '')
  const search = ref('')

  const selectedGameId = ref<string | null>(null)
  const selectedTeamId = ref<'home' | 'away' | null>(null)
  const rightPanelTab = ref<SportRightPanelTab>('game')

  const availableLeagues = computed(() => {
    const byLeague = new Map<string, string>()

    for (const game of options.games.value) {
      const leagueId = game.leagueId || game.league
      if (!byLeague.has(leagueId)) {
        byLeague.set(leagueId, game.league)
      }
    }

    return [...byLeague.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const filteredGames = computed(() => {
    const searchValue = search.value.trim().toLowerCase()

    return options.games.value.filter((game) => {
      const gameLeagueId = game.leagueId || game.league
      const matchesLeague = league.value === 'all' || gameLeagueId === league.value
      const matchesStatus = status.value === 'all' || game.status.toLowerCase() === status.value
      const matchesDate = !date.value || game.time.includes(date.value)
      const matchesSearch = !searchValue
        || game.home.toLowerCase().includes(searchValue)
        || game.away.toLowerCase().includes(searchValue)
        || game.venue.toLowerCase().includes(searchValue)

      return matchesLeague && matchesStatus && matchesDate && matchesSearch
    })
  })

  const selectedGame = computed(() => {
    return filteredGames.value.find(game => game.id === selectedGameId.value)
      || filteredGames.value[0]
      || null
  })

  const selectedTeam = computed(() => {
    if (!selectedGame.value || !selectedTeamId.value) {
      return null
    }

    if (selectedTeamId.value === 'away') {
      return {
        id: selectedGame.value.awayTeamId || 'away',
        name: selectedGame.value.away,
      }
    }

    return {
      id: selectedGame.value.homeTeamId || 'home',
      name: selectedGame.value.home,
    }
  })

  watch(() => options.sport.value, (sport) => {
    const selection = dashboardStore.ensureSportSelection(sport)
    league.value = selection.leagueId || 'all'
    selectedGameId.value = selection.gameId
  }, { immediate: true })

  watch(filteredGames, (games) => {
    if (!games.length) {
      selectedGameId.value = null
      selectedTeamId.value = null
      return
    }

    if (!games.some(game => game.id === selectedGameId.value)) {
      selectedGameId.value = games[0].id
    }

    if (!selectedTeamId.value) {
      selectedTeamId.value = 'home'
    }
  }, { immediate: true })

  watch([league, selectedGame], () => {
    const game = selectedGame.value
    dashboardStore.setSelection(options.sport.value, {
      leagueId: league.value === 'all' ? null : league.value,
      gameId: game?.gameId || null,
      homeTeamId: game?.homeTeamId || null,
      awayTeamId: game?.awayTeamId || null,
      season: game?.season ?? null,
    })
  })

  function setSelectedGame(gameId: string) {
    selectedGameId.value = gameId
    selectedTeamId.value = 'home'
    rightPanelTab.value = 'game'

    const game = options.games.value.find(entry => entry.id === gameId)
    dashboardStore.setSelection(options.sport.value, {
      gameId: game?.gameId || null,
      leagueId: game?.leagueId || null,
      homeTeamId: game?.homeTeamId || null,
      awayTeamId: game?.awayTeamId || null,
      season: game?.season ?? null,
    })
  }

  function setSelectedTeam(teamId: 'home' | 'away') {
    selectedTeamId.value = teamId
    rightPanelTab.value = 'team'

    const game = selectedGame.value
    dashboardStore.setSelection(options.sport.value, {
      teamId: teamId === 'home' ? game?.homeTeamId || null : game?.awayTeamId || null,
      leagueId: game?.leagueId || null,
      season: game?.season ?? null,
    })
  }

  function setLeague(leagueId: string) {
    league.value = leagueId
    dashboardStore.setSelection(options.sport.value, {
      leagueId: leagueId === 'all' ? null : leagueId,
    })
    rightPanelTab.value = 'standings'
  }

  return {
    sport: options.sport,
    league,
    status,
    date,
    search,
    availableLeagues,
    filteredGames,
    selectedGameId,
    selectedTeamId,
    rightPanelTab,
    selectedGame,
    selectedTeam,
    setLeague,
    setSelectedGame,
    setSelectedTeam,
  }
}
