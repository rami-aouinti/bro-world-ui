<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import CardTableLayout from './CardTableLayout.vue'

defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

type Suit = '♠' | '♥' | '♦' | '♣'

type Player = 'player' | 'ai'

interface Card {
  id: string
  suit: Suit
  rank: number
}

const { t } = useI18n()

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const TURN_SECONDS = 120

const rankLabels: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
}

const cardPoints = (card: Card) => {
  if (card.rank === 1) return 11
  if (card.rank >= 10) return 10
  return card.rank
}

const deck = (): Card[] => suits.flatMap(suit => Array.from({ length: 13 }, (_, index) => {
  const rank = index + 1
  return {
    id: `${suit}-${rank}`,
    suit,
    rank,
  }
}))

const shuffle = <T,>(items: T[]): T[] => {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = cloned[index]
    cloned[index] = cloned[randomIndex]
    cloned[randomIndex] = current
  }
  return cloned
}

const formatRank = (rank: number) => rankLabels[rank] ?? String(rank)

const stock = ref<Card[]>([])
const discardPile = ref<Card[]>([])
const playerHand = ref<Card[]>([])
const aiHand = ref<Card[]>([])
const selectedCardIds = ref<string[]>([])
const playerMelds = ref<Card[][]>([])
const aiMelds = ref<Card[][]>([])
const playerOpened = ref(false)
const aiOpened = ref(false)
const currentTurn = ref<Player>('player')
const hasDrawn = ref(false)
const winner = ref<Player | null>(null)
const timer = ref(TURN_SECONDS)
const message = ref('')

let timerInterval: ReturnType<typeof setInterval> | null = null
let aiTimeout: ReturnType<typeof setTimeout> | null = null

const isRedSuit = (suit: Suit) => suit === '♥' || suit === '♦'

const tablePlayers = computed(() => [
  {
    id: 'ai',
    name: 'Ordinateur',
    isAI: true,
    handCount: aiHand.value.length,
    isCurrentTurn: currentTurn.value === 'ai',
    timerSeconds: currentTurn.value === 'ai' ? timer.value : undefined,
  },
  {
    id: 'seat-east',
    name: 'Siège libre',
    isAI: true,
    handCount: 0,
    isCurrentTurn: false,
  },
  {
    id: 'player',
    name: 'Vous',
    isAI: false,
    handCount: playerHand.value.length,
    isCurrentTurn: currentTurn.value === 'player',
    timerSeconds: currentTurn.value === 'player' ? timer.value : undefined,
  },
  {
    id: 'seat-west',
    name: 'Siège libre',
    isAI: true,
    handCount: 0,
    isCurrentTurn: false,
  },
])

const centerMelds = computed(() => [
  ...playerMelds.value.map(meld => meld.map(card => `${formatRank(card.rank)}${card.suit}`)),
  ...aiMelds.value.map(meld => meld.map(card => `${formatRank(card.rank)}${card.suit}`)),
])

const centerCards = computed(() => discardPile.value.slice(0, 6).map(card => `${formatRank(card.rank)}${card.suit}`))

const selectedCards = computed(() => playerHand.value.filter(card => selectedCardIds.value.includes(card.id)))
const canDraw = computed(() => currentTurn.value === 'player' && !hasDrawn.value && !winner.value)
const canDiscard = computed(() => currentTurn.value === 'player' && hasDrawn.value && !winner.value)
const canCreateMeld = computed(() => currentTurn.value === 'player' && !winner.value)

const score = computed(() => playerMelds.value.flat().reduce((total, card) => total + cardPoints(card), 0))

const isSet = (cards: Card[]) => {
  if (cards.length < 3 || cards.length > 4) return false
  const uniqueRanks = new Set(cards.map(card => card.rank))
  const uniqueSuits = new Set(cards.map(card => card.suit))
  return uniqueRanks.size === 1 && uniqueSuits.size === cards.length
}

const isStraightRun = (cards: Card[]) => {
  const orderedRanks = cards.map(card => card.rank).sort((left, right) => left - right)
  for (let index = 1; index < orderedRanks.length; index += 1) {
    if (orderedRanks[index] !== orderedRanks[index - 1] + 1) return false
  }
  return true
}

const isQkaRun = (cards: Card[]) => {
  if (cards.length !== 3) return false
  const orderedRanks = cards.map(card => card.rank).sort((left, right) => left - right)
  return orderedRanks[0] === 1 && orderedRanks[1] === 12 && orderedRanks[2] === 13
}

const isRun = (cards: Card[]) => {
  if (cards.length < 3 || cards.length > 6) return false
  const sameSuit = new Set(cards.map(card => card.suit)).size === 1
  if (!sameSuit) return false
  return isStraightRun(cards) || isQkaRun(cards)
}

const isValidMeld = (cards: Card[]) => isSet(cards) || isRun(cards)
const meldPoints = (cards: Card[]) => cards.reduce((total, card) => total + cardPoints(card), 0)

const isSelected = (cardId: string) => selectedCardIds.value.includes(cardId)

const toggleCard = (cardId: string) => {
  if (currentTurn.value !== 'player' || winner.value) return

  if (isSelected(cardId)) {
    selectedCardIds.value = selectedCardIds.value.filter(id => id !== cardId)
    return
  }

  selectedCardIds.value.push(cardId)
}

const computeCardUtility = (card: Card, hand: Card[]) => {
  const sameRankCount = hand.filter(item => item.rank === card.rank && item.id !== card.id).length
  const sameSuitCards = hand.filter(item => item.suit === card.suit && item.id !== card.id)
  const nearSuitCards = sameSuitCards.filter((item) => {
    const delta = Math.abs(item.rank - card.rank)
    const qkaBridge = [1, 12, 13].includes(item.rank) && [1, 12, 13].includes(card.rank)
    return delta <= 2 || qkaBridge
  }).length
  return (sameRankCount * 3) + (nearSuitCards * 2) + cardPoints(card)
}

const sortHand = (cards: Card[]) => [...cards].sort((left, right) => {
  if (left.suit === right.suit) return left.rank - right.rank
  return left.suit.localeCompare(right.suit)
})

const pickDiscardCard = (hand: Card[]) => {
  const sorted = [...hand].sort((left, right) => computeCardUtility(left, hand) - computeCardUtility(right, hand))
  return sorted[0]
}

const findBestMeld = (hand: Card[]) => {
  let best: Card[] | null = null

  for (let first = 0; first < hand.length; first += 1) {
    for (let second = first + 1; second < hand.length; second += 1) {
      for (let third = second + 1; third < hand.length; third += 1) {
        const base = [hand[first], hand[second], hand[third]]
        if (isValidMeld(base) && (!best || meldPoints(base) > meldPoints(best))) best = base

        for (let fourth = third + 1; fourth < hand.length; fourth += 1) {
          const four = [...base, hand[fourth]]
          if (isValidMeld(four) && (!best || meldPoints(four) > meldPoints(best))) best = four

          for (let fifth = fourth + 1; fifth < hand.length; fifth += 1) {
            const five = [...four, hand[fifth]]
            if (isValidMeld(five) && (!best || meldPoints(five) > meldPoints(best))) best = five

            for (let sixth = fifth + 1; sixth < hand.length; sixth += 1) {
              const six = [...five, hand[sixth]]
              if (isValidMeld(six) && (!best || meldPoints(six) > meldPoints(best))) best = six
            }
          }
        }
      }
    }
  }

  return best
}

const finishTurn = (next: Player) => {
  hasDrawn.value = false
  selectedCardIds.value = []
  currentTurn.value = next
  timer.value = TURN_SECONDS
}

const startTurnTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (winner.value) return

    timer.value -= 1
    if (timer.value > 0) return

    if (currentTurn.value === 'player') {
      if (!hasDrawn.value) {
        drawCardFor('player')
      }

      autoDiscardForPlayer()
    }
    else {
      executeAiTurn(true)
    }
  }, 1000)
}

const checkWin = () => {
  if (!playerHand.value.length) {
    winner.value = 'player'
    message.value = 'Vous gagnez ! Toutes vos cartes sont posées.'
    return true
  }

  if (!aiHand.value.length) {
    winner.value = 'ai'
    message.value = 'L’ordinateur gagne la manche.'
    return true
  }

  return false
}

const removeCardsFromHand = (hand: Card[], cardsToRemove: Card[]) => {
  const ids = new Set(cardsToRemove.map(card => card.id))
  return hand.filter(card => !ids.has(card.id))
}

const drawCardFor = (player: Player) => {
  if (!stock.value.length) {
    message.value = t('gameComponents.rami.messages.deckEmpty')
    return null
  }

  const drawnCard = stock.value.shift() as Card
  if (player === 'player') {
    playerHand.value = sortHand([...playerHand.value, drawnCard])
    hasDrawn.value = true
    message.value = t('gameComponents.rami.messages.cardDrawn')
  }
  else {
    aiHand.value = sortHand([...aiHand.value, drawnCard])
  }

  return drawnCard
}

const drawCard = () => {
  if (!canDraw.value) return
  drawCardFor('player')
}

const discardCard = (cardId: string) => {
  if (!canDiscard.value) return
  const card = playerHand.value.find(item => item.id === cardId)
  if (!card) return

  playerHand.value = playerHand.value.filter(item => item.id !== card.id)
  discardPile.value.unshift(card)
  message.value = 'Tour terminé. L’ordinateur joue…'

  if (checkWin()) return

  finishTurn('ai')
  scheduleAiTurn()
}

const autoDiscardForPlayer = () => {
  if (!playerHand.value.length) return

  const card = pickDiscardCard(playerHand.value)
  discardCard(card.id)
}

const createMeld = () => {
  if (!canCreateMeld.value) return

  const cards = [...selectedCards.value]
  if (!isValidMeld(cards)) {
    message.value = t('gameComponents.rami.messages.invalidCombination')
    return
  }

  if (!playerOpened.value && meldPoints(cards) < 51) {
    message.value = 'Ouverture refusée: il faut poser au moins 51 points.'
    return
  }

  playerMelds.value.push(sortHand(cards))
  playerHand.value = sortHand(removeCardsFromHand(playerHand.value, cards))
  selectedCardIds.value = []

  if (!playerOpened.value) {
    playerOpened.value = true
  }

  message.value = t('gameComponents.rami.messages.goodCombination')
  checkWin()
}

const executeAiTurn = (forcedByTimer = false) => {
  if (winner.value || currentTurn.value !== 'ai') return

  if (!hasDrawn.value) {
    drawCardFor('ai')
    hasDrawn.value = true
  }

  let aiWorkingHand = [...aiHand.value]
  let canContinue = true

  while (canContinue) {
    const bestMeld = findBestMeld(aiWorkingHand)
    if (!bestMeld) break

    if (!aiOpened.value && meldPoints(bestMeld) < 51) break

    aiMelds.value.push(sortHand(bestMeld))
    aiWorkingHand = removeCardsFromHand(aiWorkingHand, bestMeld)
    if (!aiOpened.value) aiOpened.value = true

    if (!aiWorkingHand.length) break

    canContinue = aiOpened.value
  }

  aiHand.value = sortHand(aiWorkingHand)

  if (!checkWin()) {
    const discard = pickDiscardCard(aiHand.value)
    aiHand.value = aiHand.value.filter(card => card.id !== discard.id)
    discardPile.value.unshift(discard)
    message.value = forcedByTimer
      ? 'L’ordinateur a joué automatiquement (temps écoulé). À vous de jouer.'
      : 'L’ordinateur a joué. À vous !'

    if (!checkWin()) {
      finishTurn('player')
    }
  }
}

const scheduleAiTurn = () => {
  if (aiTimeout) clearTimeout(aiTimeout)
  aiTimeout = setTimeout(() => executeAiTurn(), 900)
}

const reset = () => {
  const randomDeck = shuffle(deck())
  playerHand.value = sortHand(randomDeck.slice(0, 14))
  aiHand.value = sortHand(randomDeck.slice(14, 28))
  stock.value = randomDeck.slice(28)
  discardPile.value = []
  selectedCardIds.value = []
  playerMelds.value = []
  aiMelds.value = []
  playerOpened.value = false
  aiOpened.value = false
  currentTurn.value = 'player'
  hasDrawn.value = false
  timer.value = TURN_SECONDS
  winner.value = null
  message.value = 'Nouvelle partie: 14 cartes chacun. Piochez puis défaussez.'
  startTurnTimer()
}

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (aiTimeout) clearTimeout(aiTimeout)
})

reset()
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
    <div>
      <h3 class="game-title mb-1">{{ t('gameComponents.rami.title') }}</h3>
      <p class="game-subtitle mb-0">Points posés: <strong>{{ score }}</strong> · Tour: <strong>{{ currentTurn === 'player' ? 'Vous' : 'Ordinateur' }}</strong></p>
    </div>
    <div class="d-flex ga-2 flex-wrap justify-end">
      <v-chip color="primary" variant="tonal" prepend-icon="mdi-timer-outline">
        {{ timer }}s / {{ TURN_SECONDS }}s
      </v-chip>
      <v-chip color="secondary" variant="outlined">Pioche: {{ stock.length }}</v-chip>
      <v-btn variant="outlined" prepend-icon="mdi-cards" :disabled="!canDraw" @click="drawCard">{{ t('gameComponents.rami.actions.draw') }}</v-btn>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">{{ t('gameComponents.rami.actions.playAgain') }}</v-btn>
    </div>
  </div>

  <p class="game-description mb-3">{{ message }}</p>

  <CardTableLayout :players="tablePlayers" :center-cards="centerCards" :center-melds="centerMelds" :turn-timer-seconds="TURN_SECONDS">
    <section class="mb-4">
      <h4 class="text-subtitle-1 mb-2 font-weight-bold">Main adverse (dos des cartes)</h4>
      <div class="game-card-grid game-card-grid--opponent">
        <div v-for="card in aiHand" :key="`ai-${card.id}`" class="play-card play-card--back" />
      </div>
    </section>

    <section class="mb-2">
      <h4 class="text-subtitle-1 mb-2 font-weight-bold">{{ t('gameComponents.rami.hand') }} ({{ playerHand.length }})</h4>
      <div class="game-card-grid mb-4">
        <button
          v-for="card in playerHand"
          :key="card.id"
          type="button"
          class="play-card play-card--front"
          :class="{ 'play-card--selected': isSelected(card.id) }"
          @click="toggleCard(card.id)"
          @dblclick="discardCard(card.id)"
        >
          <span class="card-corner" :class="{ 'text-red': isRedSuit(card.suit), 'text-black': !isRedSuit(card.suit) }">
            {{ formatRank(card.rank) }}{{ card.suit }}
          </span>
          <span class="card-center" :class="{ 'text-red': isRedSuit(card.suit), 'text-black': !isRedSuit(card.suit) }">{{ card.suit }}</span>
          <span class="card-corner card-corner--bottom" :class="{ 'text-red': isRedSuit(card.suit), 'text-black': !isRedSuit(card.suit) }">
            {{ formatRank(card.rank) }}{{ card.suit }}
          </span>
        </button>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-btn :disabled="!selectedCards.length || !canCreateMeld" color="secondary" variant="outlined" @click="createMeld">
          {{ t('gameComponents.rami.actions.playCombination', { count: selectedCards.length }) }}
        </v-btn>
        <v-btn
          :disabled="!canDiscard || selectedCards.length !== 1"
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          @click="discardCard(selectedCards[0]?.id)"
        >
          Défausser la carte sélectionnée
        </v-btn>
      </div>

      <p class="text-caption mt-2 mb-0 text-medium-emphasis">
        Règle: vous devez piocher puis défausser pour terminer le tour. Double-cliquez aussi sur une carte pour la défausser rapidement.
      </p>
    </section>
  </CardTableLayout>
</template>

<style scoped>
.game-title {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
}

.game-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.76);
  font-size: 0.92rem;
}

.game-description {
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-size: 0.94rem;
}

.game-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.game-card-grid--opponent {
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
}

.play-card {
  border-radius: 10px;
  min-height: 102px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.play-card--front {
  background: linear-gradient(160deg, #fff, #f6f7fb);
  box-shadow: 0 7px 18px rgba(15, 23, 42, 0.16);
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
}

.play-card--back {
  min-height: 72px;
  border: 1px solid #1f3153;
  background: repeating-linear-gradient(45deg, #26457a 0, #26457a 8px, #1a2e52 8px, #1a2e52 16px);
  box-shadow: 0 5px 12px rgba(15, 23, 42, 0.18);
}

.play-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.play-card--selected {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.19);
}

.card-corner {
  font-size: 0.92rem;
  font-weight: 700;
}

.card-corner--bottom {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-center {
  align-self: center;
  font-size: 1.7rem;
  line-height: 1;
}
</style>
