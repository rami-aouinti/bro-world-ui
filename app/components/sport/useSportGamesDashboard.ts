import { computed, ref, watch, type Ref } from 'vue'
import type { SportGameCardItem } from './types'

export type SportRightPanelTab = 'game' | 'team' | 'standings'

export function useSportGamesDashboard(options: {
  sport: Ref<string>
  games: Ref<SportGameCardItem[]>
  initialDate?: string
}) {
  const league = ref('all')
  const status = ref('all')
  const date = ref(options.initialDate || '')
  const search = ref('')

  const selectedGameId = ref<string | null>(null)
  const selectedTeamId = ref<string | null>(null)
  const rightPanelTab = ref<SportRightPanelTab>('game')

  const availableLeagues = computed(() => {
    return [...new Set(options.games.value.map(game => game.league))].sort((a, b) => a.localeCompare(b))
  })

  const filteredGames = computed(() => {
    const searchValue = search.value.trim().toLowerCase()

    return options.games.value.filter((game) => {
      const matchesLeague = league.value === 'all' || game.league === league.value
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
    if (!selectedGame.value) {
      return null
    }

    if (selectedTeamId.value === 'away') {
      return {
        id: 'away',
        name: selectedGame.value.away,
      }
    }

    return {
      id: 'home',
      name: selectedGame.value.home,
    }
  })

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

  function setSelectedGame(gameId: string) {
    selectedGameId.value = gameId
    selectedTeamId.value = 'home'
    rightPanelTab.value = 'game'
  }

  function setSelectedTeam(teamId: 'home' | 'away') {
    selectedTeamId.value = teamId
    rightPanelTab.value = 'team'
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
    setSelectedGame,
    setSelectedTeam,
  }
}
