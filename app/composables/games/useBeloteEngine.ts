import { computed, onScopeDispose, ref } from 'vue'

export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = '7' | '8' | '9' | 'J' | 'Q' | 'K' | '10' | 'A'
export type BeloteMode = 'teams' | 'free-for-all'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
}

interface TrickPlay {
  playerIndex: number
  card: Card
}

interface BelotePlayer {
  id: string
  name: string
  isAI: boolean
  hand: Card[]
}

const TURN_SECONDS = 120
const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A']

const trumpStrength: Record<Rank, number> = {
  J: 8,
  '9': 7,
  A: 6,
  '10': 5,
  K: 4,
  Q: 3,
  '8': 2,
  '7': 1,
}

const normalStrength: Record<Rank, number> = {
  A: 8,
  '10': 7,
  K: 6,
  Q: 5,
  J: 4,
  '9': 3,
  '8': 2,
  '7': 1,
}

const cardPoints: Record<Rank, number> = {
  A: 11,
  '10': 10,
  K: 4,
  Q: 3,
  J: 2,
  '9': 0,
  '8': 0,
  '7': 0,
}

const playerTemplates: Omit<BelotePlayer, 'hand'>[] = [
  { id: 'player', name: 'Vous', isAI: false },
  { id: 'ai-east', name: 'IA Est', isAI: true },
  { id: 'ai-north', name: 'IA Nord', isAI: true },
  { id: 'ai-west', name: 'IA Ouest', isAI: true },
]

const shuffle = <T,>(items: T[]) => {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = output[index]
    output[index] = output[randomIndex]
    output[randomIndex] = current
  }
  return output
}

const createDeck = (): Card[] => suits.flatMap(suit => ranks.map(rank => ({ id: `${suit}-${rank}`, suit, rank })))

export const useBeloteEngine = (mode: () => BeloteMode) => {
  const players = ref<BelotePlayer[]>(playerTemplates.map(player => ({ ...player, hand: [] })))
  const trumpSuit = ref<Suit>('♠')
  const trick = ref<TrickPlay[]>([])
  const trickLeaderIndex = ref(0)
  const turnIndex = ref(0)
  const trickCount = ref(0)
  const message = ref('Choisissez une carte valide pour commencer le pli.')
  const roundOver = ref(false)
  const roundResult = ref('')
  const playerScores = ref<number[]>([0, 0, 0, 0])
  const teamScores = ref({ teamA: 0, teamB: 0 })
  const timerSeconds = ref(TURN_SECONDS)

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let aiTimeout: ReturnType<typeof setTimeout> | null = null

  const resetTurnTimer = () => {
    timerSeconds.value = TURN_SECONDS
  }

  const startTurnTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    timerInterval = setInterval(() => {
      if (roundOver.value) return

      timerSeconds.value = Math.max(0, timerSeconds.value - 1)

      if (timerSeconds.value > 0) return

      if (turnIndex.value !== 0) {
        resetTurnTimer()
        return
      }

      const forcedCard = getValidCards(0).at(0)
      if (forcedCard) {
        playCard(0, forcedCard.id)
      }
    }, 1000)
  }

  const compareCards = (left: Card, right: Card, leadSuit: Suit) => {
    const leftTrump = left.suit === trumpSuit.value
    const rightTrump = right.suit === trumpSuit.value

    if (leftTrump && rightTrump) return trumpStrength[left.rank] - trumpStrength[right.rank]
    if (leftTrump) return 1
    if (rightTrump) return -1

    const leftLead = left.suit === leadSuit
    const rightLead = right.suit === leadSuit

    if (leftLead && rightLead) return normalStrength[left.rank] - normalStrength[right.rank]
    if (leftLead) return 1
    if (rightLead) return -1

    return 0
  }

  const getValidCards = (playerIndex: number) => {
    const player = players.value[playerIndex]
    const leadSuit = trick.value[0]?.card.suit

    if (!player) return []
    if (!leadSuit) return player.hand

    const sameSuitCards = player.hand.filter(card => card.suit === leadSuit)
    return sameSuitCards.length ? sameSuitCards : player.hand
  }

  const aiPickCard = (playerIndex: number) => {
    const validCards = getValidCards(playerIndex)
    const leadSuit = trick.value[0]?.card.suit

    if (!validCards.length) return null

    if (!leadSuit) {
      return [...validCards].sort((a, b) => cardPoints[b.rank] - cardPoints[a.rank] || normalStrength[b.rank] - normalStrength[a.rank])[0]
    }

    const leadSuitCards = validCards.filter(card => card.suit === leadSuit)
    if (leadSuitCards.length) {
      return [...leadSuitCards].sort((a, b) => compareCards(b, a, leadSuit))[0]
    }

    const trumpCards = validCards.filter(card => card.suit === trumpSuit.value)
    if (trumpCards.length) {
      return [...trumpCards].sort((a, b) => trumpStrength[a.rank] - trumpStrength[b.rank])[0]
    }

    return [...validCards].sort((a, b) => cardPoints[a.rank] - cardPoints[b.rank] || normalStrength[a.rank] - normalStrength[b.rank])[0]
  }

  const resolveTrick = () => {
    const leadSuit = trick.value[0]?.card.suit
    if (!leadSuit || trick.value.length !== 4) return

    const winner = trick.value.reduce((best, current) => (compareCards(current.card, best.card, leadSuit) > 0 ? current : best))
    const points = trick.value.reduce((sum, play) => sum + cardPoints[play.card.rank], 0)

    if (mode() === 'teams') {
      if (winner.playerIndex % 2 === 0) {
        teamScores.value.teamA += points
      }
      else {
        teamScores.value.teamB += points
      }
    }
    else {
      playerScores.value[winner.playerIndex] += points
    }

    message.value = `${players.value[winner.playerIndex].name} remporte le pli (+${points}).`
    trickCount.value += 1
    trickLeaderIndex.value = winner.playerIndex
    turnIndex.value = winner.playerIndex

    if (trickCount.value >= 8) {
      roundOver.value = true

      if (mode() === 'teams') {
        const { teamA, teamB } = teamScores.value
        if (teamA === teamB) roundResult.value = `Égalité ${teamA}-${teamB}.`
        else roundResult.value = teamA > teamB ? `Équipe A gagne ${teamA}-${teamB}.` : `Équipe B gagne ${teamB}-${teamA}.`
      }
      else {
        const topScore = Math.max(...playerScores.value)
        const winnerIndex = playerScores.value.findIndex(score => score === topScore)
        roundResult.value = `${players.value[winnerIndex].name} gagne avec ${topScore} points.`
      }
      return
    }

    setTimeout(() => {
      trick.value = []
      resetTurnTimer()
      processAiTurns()
    }, 900)
  }

  const playCard = (playerIndex: number, cardId: string) => {
    if (roundOver.value || playerIndex !== turnIndex.value) return false

    const hand = players.value[playerIndex].hand
    const card = hand.find(entry => entry.id === cardId)
    if (!card) return false

    const validCards = getValidCards(playerIndex)
    if (!validCards.some(entry => entry.id === card.id)) return false

    players.value[playerIndex].hand = hand.filter(entry => entry.id !== card.id)
    trick.value.push({ playerIndex, card })

    if (trick.value.length === 4) {
      resolveTrick()
      return true
    }

    turnIndex.value = (turnIndex.value + 1) % 4
    resetTurnTimer()
    processAiTurns()
    return true
  }

  const processAiTurns = () => {
    if (roundOver.value) return

    if (aiTimeout) {
      clearTimeout(aiTimeout)
      aiTimeout = null
    }

    if (turnIndex.value === 0) return

    aiTimeout = setTimeout(() => {
      const chosenCard = aiPickCard(turnIndex.value)
      if (chosenCard) {
        playCard(turnIndex.value, chosenCard.id)
      }
    }, 550)
  }

  const restartRound = () => {
    const freshDeck = shuffle(createDeck())
    players.value = playerTemplates.map((template, index) => ({
      ...template,
      hand: freshDeck.slice(index * 8, (index + 1) * 8),
    }))

    trumpSuit.value = suits[Math.floor(Math.random() * suits.length)]
    trick.value = []
    trickCount.value = 0
    trickLeaderIndex.value = 0
    turnIndex.value = 0
    roundOver.value = false
    roundResult.value = ''
    message.value = 'Nouvelle manche distribuée.'
    playerScores.value = [0, 0, 0, 0]
    teamScores.value = { teamA: 0, teamB: 0 }
    resetTurnTimer()
    processAiTurns()
  }

  const humanPlayableCards = computed(() => getValidCards(0))
  const canHumanPlay = computed(() => !roundOver.value && turnIndex.value === 0)

  restartRound()
  startTurnTimer()

  onScopeDispose(() => {
    if (timerInterval) clearInterval(timerInterval)
    if (aiTimeout) clearTimeout(aiTimeout)
  })

  return {
    TURN_SECONDS,
    players,
    trumpSuit,
    trick,
    trickCount,
    turnIndex,
    trickLeaderIndex,
    timerSeconds,
    message,
    roundOver,
    roundResult,
    playerScores,
    teamScores,
    canHumanPlay,
    humanPlayableCards,
    playCard,
    restartRound,
  }
}
