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
const draggedCardId = ref<string | null>(null)
const dragPosition = ref<{ x: number, y: number }>({ x: 0, y: 0 })
const dragStartPosition = ref<{ x: number, y: number }>({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOverDiscardZone = ref(false)
const throwingCardId = ref<string | null>(null)
const throwAnimationOffset = ref<{ x: number, y: number }>({ x: 0, y: 0 })
const discardDropZone = ref<HTMLElement | null>(null)

let timerInterval: ReturnType<typeof setInterval> | null = null
let aiTimeout: ReturnType<typeof setTimeout> | null = null
let throwTimeout: ReturnType<typeof setTimeout> | null = null

const isRedSuit = (suit: Suit) => suit === '♥' || suit === '♦'

const tablePlayers = computed(() => [
  {
    id: 'ai',
    name: t('gameComponents.rami.players.computer'),
    isAI: true,
    handCount: aiHand.value.length,
    isCurrentTurn: currentTurn.value === 'ai',
    timerSeconds: currentTurn.value === 'ai' ? timer.value : undefined,
  },
  {
    id: 'seat-east',
    name: t('gameComponents.rami.players.emptySeat'),
    isAI: true,
    handCount: 0,
    isCurrentTurn: false,
  },
  {
    id: 'player',
    name: t('gameComponents.rami.players.you'),
    isAI: false,
    handCount: playerHand.value.length,
    isCurrentTurn: currentTurn.value === 'player',
    timerSeconds: currentTurn.value === 'player' ? timer.value : undefined,
  },
  {
    id: 'seat-west',
    name: t('gameComponents.rami.players.emptySeat'),
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
const canReorderHand = computed(() => currentTurn.value === 'player' && !winner.value)
const topDiscardCard = computed(() => discardPile.value[0] ?? null)

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

type SortMode = 'manual' | 'color' | 'rank' | 'potential'

const currentSortMode = ref<SortMode>('manual')
const dragHoverCardId = ref<string | null>(null)
const didDrag = ref(false)

const sortHand = (cards: Card[]) => [...cards].sort((left, right) => {
  if (left.suit === right.suit) return left.rank - right.rank
  return left.suit.localeCompare(right.suit)
})

const sortByRank = (cards: Card[]) => [...cards].sort((left, right) => {
  if (left.rank === right.rank) return left.suit.localeCompare(right.suit)
  return left.rank - right.rank
})

const sortByColor = (cards: Card[]) => [...cards].sort((left, right) => {
  const leftColor = isRedSuit(left.suit) ? 1 : 0
  const rightColor = isRedSuit(right.suit) ? 1 : 0
  if (leftColor === rightColor) {
    if (left.suit === right.suit) return left.rank - right.rank
    return left.suit.localeCompare(right.suit)
  }
  return leftColor - rightColor
})

const syncSelectedCardIds = () => {
  const handOrder = new Map(playerHand.value.map((card, index) => [card.id, index]))
  selectedCardIds.value = selectedCardIds.value
    .filter(id => handOrder.has(id))
    .sort((left, right) => (handOrder.get(left) ?? 0) - (handOrder.get(right) ?? 0))
}

const buildSuggestedGroups = (hand: Card[]) => {
  const suggestions: Card[][] = []

  const byRank = new Map<number, Card[]>()
  hand.forEach((card) => {
    const list = byRank.get(card.rank) ?? []
    list.push(card)
    byRank.set(card.rank, list)
  })
  byRank.forEach((cards) => {
    const uniqueSuits = new Set(cards.map(card => card.suit))
    if (cards.length >= 3 && uniqueSuits.size >= 3) {
      suggestions.push(cards.slice(0, 4))
    }
  })

  const bySuit = new Map<Suit, Card[]>()
  hand.forEach((card) => {
    const list = bySuit.get(card.suit) ?? []
    list.push(card)
    bySuit.set(card.suit, list)
  })
  bySuit.forEach((cards) => {
    const ordered = [...cards].sort((left, right) => left.rank - right.rank)
    let run: Card[] = []
    ordered.forEach((card) => {
      if (!run.length) {
        run = [card]
        return
      }

      const previous = run[run.length - 1]
      if (card.rank === previous.rank + 1) {
        run.push(card)
      }
      else if (card.rank !== previous.rank) {
        if (run.length >= 3) suggestions.push([...run])
        run = [card]
      }
    })

    if (run.length >= 3) suggestions.push([...run])

    const hasAce = ordered.some(card => card.rank === 1)
    const hasQueen = ordered.some(card => card.rank === 12)
    const hasKing = ordered.some(card => card.rank === 13)
    if (hasAce && hasQueen && hasKing) {
      suggestions.push(ordered.filter(card => [1, 12, 13].includes(card.rank)).slice(0, 3))
    }
  })

  return suggestions
}

const suggestedGroups = computed(() => buildSuggestedGroups(playerHand.value))
const suggestedCardIds = computed(() => {
  const ids = new Set<string>()
  suggestedGroups.value.forEach(group => group.forEach(card => ids.add(card.id)))
  return ids
})

const sortByPotential = (cards: Card[]) => {
  const suggestions = buildSuggestedGroups(cards)
  const suggestedIds = new Set<string>()
  suggestions.forEach(group => group.forEach(card => suggestedIds.add(card.id)))

  return [...cards].sort((left, right) => {
    const leftSuggested = suggestedIds.has(left.id) ? 1 : 0
    const rightSuggested = suggestedIds.has(right.id) ? 1 : 0
    if (leftSuggested !== rightSuggested) return rightSuggested - leftSuggested
    const utilityDelta = computeCardUtility(right, cards) - computeCardUtility(left, cards)
    if (utilityDelta !== 0) return utilityDelta
    if (left.suit === right.suit) return left.rank - right.rank
    return left.suit.localeCompare(right.suit)
  })
}

const reorderCard = (cardId: string, targetCardId: string) => {
  if (cardId === targetCardId) return
  const fromIndex = playerHand.value.findIndex(card => card.id === cardId)
  const targetIndex = playerHand.value.findIndex(card => card.id === targetCardId)
  if (fromIndex === -1 || targetIndex === -1) return

  const reordered = [...playerHand.value]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(targetIndex, 0, moved)
  playerHand.value = reordered
  syncSelectedCardIds()
}

const applyCurrentSortToPlayerHand = () => {
  if (currentSortMode.value === 'manual') {
    syncSelectedCardIds()
    return
  }

  if (currentSortMode.value === 'color') {
    playerHand.value = sortByColor(playerHand.value)
  }
  else if (currentSortMode.value === 'rank') {
    playerHand.value = sortByRank(playerHand.value)
  }
  else {
    playerHand.value = sortByPotential(playerHand.value)
  }
  syncSelectedCardIds()
}

const setSortMode = (mode: SortMode) => {
  currentSortMode.value = mode
  applyCurrentSortToPlayerHand()
}

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
    message.value = t('gameComponents.rami.messages.playerWin')
    return true
  }

  if (!aiHand.value.length) {
    winner.value = 'ai'
    message.value = t('gameComponents.rami.messages.computerWin')
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
    playerHand.value = [...playerHand.value, drawnCard]
    applyCurrentSortToPlayerHand()
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

const completeDiscard = (cardId: string) => {
  const card = playerHand.value.find(item => item.id === cardId)
  if (!card) return

  playerHand.value = playerHand.value.filter(item => item.id !== card.id)
  discardPile.value.unshift(card)
  message.value = t('gameComponents.rami.messages.turnEndedComputerPlaying')

  if (checkWin()) return

  finishTurn('ai')
  scheduleAiTurn()
}

const discardCard = (cardId: string, withThrowAnimation = false) => {
  if (!canDiscard.value) return
  if (!withThrowAnimation) {
    completeDiscard(cardId)
    return
  }

  const cardElement = document.getElementById(`rami-card-${cardId}`)
  const dropZoneElement = discardDropZone.value
  if (!cardElement || !dropZoneElement) {
    completeDiscard(cardId)
    return
  }

  const cardRect = cardElement.getBoundingClientRect()
  const dropRect = dropZoneElement.getBoundingClientRect()
  throwAnimationOffset.value = {
    x: (dropRect.left + (dropRect.width / 2)) - (cardRect.left + (cardRect.width / 2)),
    y: (dropRect.top + (dropRect.height / 2)) - (cardRect.top + (cardRect.height / 2)),
  }
  throwingCardId.value = cardId

  if (throwTimeout) clearTimeout(throwTimeout)
  throwTimeout = setTimeout(() => {
    throwingCardId.value = null
    completeDiscard(cardId)
  }, 260)
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
    message.value = t('gameComponents.rami.messages.openingRefused', { score: 51 })
    return
  }

  playerMelds.value.push(sortHand(cards))
  playerHand.value = removeCardsFromHand(playerHand.value, cards)
  selectedCardIds.value = []
  applyCurrentSortToPlayerHand()

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
      ? t('gameComponents.rami.messages.computerAutoPlayed')
      : t('gameComponents.rami.messages.computerPlayed')

    if (!checkWin()) {
      finishTurn('player')
    }
  }
}

const scheduleAiTurn = () => {
  if (aiTimeout) clearTimeout(aiTimeout)
  aiTimeout = setTimeout(() => executeAiTurn(), 900)
}

const getDiscardZoneRect = () => discardDropZone.value?.getBoundingClientRect() ?? null

const updateDragZoneState = (x: number, y: number) => {
  const dropRect = getDiscardZoneRect()
  if (!dropRect) {
    dragOverDiscardZone.value = false
    return
  }

  dragOverDiscardZone.value = (
    x >= dropRect.left
    && x <= dropRect.right
    && y >= dropRect.top
    && y <= dropRect.bottom
  )
}

const onCardPointerDown = (event: PointerEvent, cardId: string) => {
  if (!canReorderHand.value || event.button !== 0) return
  draggedCardId.value = cardId
  dragPosition.value = { x: event.clientX, y: event.clientY }
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  dragHoverCardId.value = null
  didDrag.value = false
  isDragging.value = true
  dragOverDiscardZone.value = false
  startGlobalPointerListeners()
}

const onCardPointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return
  dragPosition.value = { x: event.clientX, y: event.clientY }
  didDrag.value = didDrag.value || Math.abs(event.clientX - dragStartPosition.value.x) + Math.abs(event.clientY - dragStartPosition.value.y) > 6
  updateDragZoneState(event.clientX, event.clientY)
}

const onCardPointerUp = () => {
  if (!isDragging.value) return
  const cardId = draggedCardId.value
  const hoverCardId = dragHoverCardId.value
  const shouldDiscard = dragOverDiscardZone.value && canDiscard.value

  draggedCardId.value = null
  dragHoverCardId.value = null
  isDragging.value = false
  dragOverDiscardZone.value = false
  stopGlobalPointerListeners()

  if (cardId && shouldDiscard) {
    discardCard(cardId, true)
    didDrag.value = false
    return
  }

  if (cardId && hoverCardId && didDrag.value) {
    reorderCard(cardId, hoverCardId)
  }

  didDrag.value = false
}

const onTouchStart = (event: TouchEvent, cardId: string) => {
  if (!canReorderHand.value) return
  const touch = event.touches[0]
  if (!touch) return

  draggedCardId.value = cardId
  dragPosition.value = { x: touch.clientX, y: touch.clientY }
  dragStartPosition.value = { x: touch.clientX, y: touch.clientY }
  dragHoverCardId.value = null
  didDrag.value = false
  isDragging.value = true
  dragOverDiscardZone.value = false
  startGlobalPointerListeners()
}

const onTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) return
  const touch = event.touches[0]
  if (!touch) return

  dragPosition.value = { x: touch.clientX, y: touch.clientY }
  didDrag.value = didDrag.value || Math.abs(touch.clientX - dragStartPosition.value.x) + Math.abs(touch.clientY - dragStartPosition.value.y) > 6
  updateDragZoneState(touch.clientX, touch.clientY)
}

const onTouchEnd = () => {
  onCardPointerUp()
}

const stopGlobalPointerListeners = () => {
  window.removeEventListener('pointermove', onCardPointerMove)
  window.removeEventListener('pointerup', onCardPointerUp)
  window.removeEventListener('pointercancel', onCardPointerUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

const startGlobalPointerListeners = () => {
  window.addEventListener('pointermove', onCardPointerMove)
  window.addEventListener('pointerup', onCardPointerUp)
  window.addEventListener('pointercancel', onCardPointerUp)
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

const onCardHover = (cardId: string) => {
  if (!isDragging.value || draggedCardId.value === cardId) return
  dragHoverCardId.value = cardId
}

const onCardClick = (cardId: string) => {
  if (didDrag.value) return
  toggleCard(cardId)
}

const cardStyle = (index: number, cardId: string) => {
  const isDragged = isDragging.value && draggedCardId.value === cardId
  const dragDeltaX = isDragged ? dragPosition.value.x - dragStartPosition.value.x : 0
  const dragDeltaY = isDragged ? dragPosition.value.y - dragStartPosition.value.y : 0
  return {
    '--card-index': index,
    '--drag-x': `${dragDeltaX}px`,
    '--drag-y': `${dragDeltaY}px`,
    '--throw-x': `${throwAnimationOffset.value.x}px`,
    '--throw-y': `${throwAnimationOffset.value.y}px`,
  }
}

const reset = () => {
  const randomDeck = shuffle(deck())
  playerHand.value = randomDeck.slice(0, 14)
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
  message.value = t('gameComponents.rami.messages.newGameDetailed', { count: 14 })
  applyCurrentSortToPlayerHand()
  startTurnTimer()
}

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (aiTimeout) clearTimeout(aiTimeout)
  if (throwTimeout) clearTimeout(throwTimeout)
  stopGlobalPointerListeners()
})

reset()
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
    <div>
      <h3 class="game-title mb-1">{{ t('gameComponents.rami.title') }}</h3>
      <p class="game-subtitle mb-0">{{ t('gameComponents.rami.pointsPlayed') }}: <strong>{{ score }}</strong> · {{ t('gameComponents.rami.turn') }}: <strong>{{ currentTurn === 'player' ? t('gameComponents.rami.players.you') : t('gameComponents.rami.players.computer') }}</strong></p>
    </div>
    <div class="d-flex ga-2 flex-wrap justify-end">
      <v-chip color="primary" variant="tonal" prepend-icon="mdi-timer-outline">
        {{ timer }}s / {{ TURN_SECONDS }}s
      </v-chip>
      <v-chip color="secondary" variant="outlined">{{ t('gameComponents.rami.drawPile') }}: {{ stock.length }}</v-chip>
      <v-btn variant="outlined" prepend-icon="mdi-cards" :disabled="!canDraw" @click="drawCard">{{ t('gameComponents.rami.actions.draw') }}</v-btn>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">{{ t('gameComponents.rami.actions.playAgain') }}</v-btn>
    </div>
  </div>

  <p class="game-description mb-3">{{ message }}</p>

  <CardTableLayout :players="tablePlayers" :center-cards="centerCards" :center-melds="centerMelds" :turn-timer-seconds="TURN_SECONDS">
    <template #center>
      <section
        ref="discardDropZone"
        class="discard-drop-zone"
        :class="{ 'discard-drop-zone--active': dragOverDiscardZone }"
        aria-label="Zone de défausse"
      >
        <p class="discard-drop-zone__title mb-1">Pile de défausse</p>
        <p class="text-caption mb-2 text-white">Glissez une carte ici pour défausser.</p>
        <span class="discard-drop-zone__card">
          {{ topDiscardCard ? `${formatRank(topDiscardCard.rank)}${topDiscardCard.suit}` : '—' }}
        </span>
      </section>
    </template>

    <template #seat-north-hand>
      <section class="seat-hand seat-hand--north">
        <h4 class="seat-hand__title text-subtitle-2 mb-1 font-weight-bold">Main adverse</h4>
        <div class="hand-fan hand-fan--opponent">
          <div
            v-for="(card, index) in aiHand"
            :key="`ai-${card.id}`"
            class="play-card play-card--back hand-fan__card hand-fan__card--back"
            :style="cardStyle(index, card.id)"
          />
        </div>
      </section>
    </template>

    <template #seat-south-hand>
      <section class="seat-hand seat-hand--south">
        <div class="player-hand-cards">
          <div class="hand-fan hand-fan--player">
            <button
              v-for="(card, index) in playerHand"
              :key="card.id"
              :id="`rami-card-${card.id}`"
              type="button"
              class="play-card play-card--front hand-fan__card"
              :class="{
                'play-card--selected': isSelected(card.id),
                'play-card--dragging': isDragging && draggedCardId === card.id,
                'play-card--drag-target': isDragging && dragHoverCardId === card.id,
                'play-card--suggested': suggestedCardIds.has(card.id),
                'card-throwing': throwingCardId === card.id,
              }"
              :style="cardStyle(index, card.id)"
              @click="onCardClick(card.id)"
              @dblclick="discardCard(card.id)"
              @pointerenter="onCardHover(card.id)"
              @pointerdown="onCardPointerDown($event, card.id)"
              @pointermove="onCardPointerMove($event)"
              @pointerup="onCardPointerUp"
              @pointercancel="onCardPointerUp"
              @touchstart.capture="onCardHover(card.id)"
              @touchstart.prevent="onTouchStart($event, card.id)"
              @touchmove.prevent="onTouchMove"
              @touchend="onTouchEnd"
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
        </div>
        <div class="player-hand-meta">
          <div class="d-flex flex-wrap justify-space-between align-center ga-2 mb-2">
            <h4 class="seat-hand__title text-subtitle-2 mb-0 font-weight-bold">{{ t('gameComponents.rami.hand') }} ({{ playerHand.length }})</h4>
            <div class="d-flex ga-1 flex-wrap">
              <v-btn
                size="x-small"
                variant="tonal"
                :color="currentSortMode === 'manual' ? 'primary' : undefined"
                @click="setSortMode('manual')"
              >
                Manuel
              </v-btn>
              <v-btn
                size="x-small"
                variant="tonal"
                :color="currentSortMode === 'color' ? 'primary' : undefined"
                @click="setSortMode('color')"
              >
                Couleur
              </v-btn>
              <v-btn
                size="x-small"
                variant="tonal"
                :color="currentSortMode === 'rank' ? 'primary' : undefined"
                @click="setSortMode('rank')"
              >
                Rang
              </v-btn>
              <v-btn
                size="x-small"
                variant="tonal"
                :color="currentSortMode === 'potential' ? 'primary' : undefined"
                @click="setSortMode('potential')"
              >
                Combos
              </v-btn>
            </div>
          </div>
          <p class="text-caption mb-2 text-medium-emphasis">
            Tri courant: <strong>{{ currentSortMode }}</strong> · Glissez sur une carte pour réorganiser, vers la pile centrale pour défausser.
          </p>
          <div v-if="suggestedGroups.length" class="suggestion-legend mb-2">
            <span class="suggestion-dot" />
            Groupes suggérés: {{ suggestedGroups.map(group => group.map(card => `${formatRank(card.rank)}${card.suit}`).join(' ')).join(' • ') }}
          </div>
        </div>
      </section>
    </template>

    <section class="mb-2">
      <h4 class="text-subtitle-1 mb-2 font-weight-bold">Actions du tour</h4>

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
          {{ t('gameComponents.rami.actions.discardSelected') }}
        </v-btn>
      </div>

      <p class="text-caption mt-2 mb-0 text-medium-emphasis">
        {{ t('gameComponents.rami.ruleHint') }}
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

.hand-fan {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 16px 10px;
  scrollbar-width: thin;
}

.hand-fan__card {
  position: relative;
  z-index: calc(var(--card-index) + 1);
  margin-left: calc(-16px - (var(--card-index) * 0.35px));
  transform-origin: center 130%;
  transform:
    rotate(calc((var(--card-index) - 7) * 1deg))
    translateY(calc(6px - (var(--card-index) * 0.28px)));
}

.hand-fan__card:first-child {
  margin-left: 0;
}

.hand-fan--opponent {
  justify-content: center;
  padding-top: 4px;
}

.hand-fan--opponent .hand-fan__card {
  margin-left: -24px;
  transform: translateY(0);
  min-height: 48px;
}

.hand-fan__card--back {
  width: 44px;
}

.seat-hand {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(3, 9, 6, 0.24);
  padding: 8px;
}

.seat-hand--south {
  position: relative;
  display: flex;
  justify-content: center;
}

.player-hand-cards {
  width: 100%;
  padding-bottom: 120px;
}

.player-hand-meta {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 5;
  max-width: 360px;
  text-align: left;
}

.seat-hand__title {
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.01em;
}

.play-card {
  border-radius: 10px;
  min-height: 96px;
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
  min-height: 54px;
  border: 1px solid #1f3153;
  background: repeating-linear-gradient(45deg, #26457a 0, #26457a 8px, #1a2e52 8px, #1a2e52 16px);
  box-shadow: 0 5px 12px rgba(15, 23, 42, 0.18);
}

.play-card:hover {
  filter: brightness(1.02);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.play-card--selected {
  border-color: rgb(var(--v-theme-primary));
  transform:
    rotate(calc((var(--card-index) - 7) * 1deg))
    translateY(-12px)
    scale(1.03);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.19);
}

.play-card--dragging {
  z-index: 20;
  cursor: grabbing;
  transform:
    rotate(calc((var(--card-index) - 7) * 1deg))
    translate(var(--drag-x, 0), calc(var(--drag-y, 0px) - 18px))
    scale(1.06);
}

.play-card--drag-target {
  border-color: rgb(var(--v-theme-secondary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-secondary), 0.35);
}

.play-card--suggested {
  border-color: rgba(16, 185, 129, 0.75);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18), 0 10px 18px rgba(15, 23, 42, 0.16);
}

.card-throwing {
  pointer-events: none;
  animation: card-throwing 250ms ease-in forwards;
}

@keyframes card-throwing {
  to {
    transform:
      translate(var(--throw-x, 0), var(--throw-y, -40px))
      scale(0.72)
      rotate(10deg);
    opacity: 0;
  }
}

.discard-drop-zone {
  position: relative;
  z-index: 1;
  min-width: 190px;
  border-radius: 14px;
  border: 2px dashed rgba(255, 255, 255, 0.65);
  background: rgba(3, 9, 6, 0.36);
  padding: 12px;
  text-align: center;
  color: #fff;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.discard-drop-zone--active {
  border-color: rgb(var(--v-theme-error));
  background: rgba(171, 23, 47, 0.28);
  transform: scale(1.03);
}

.discard-drop-zone__title {
  font-weight: 700;
  letter-spacing: 0.01em;
}

.discard-drop-zone__card {
  display: inline-flex;
  min-width: 52px;
  justify-content: center;
  border-radius: 8px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  font-weight: 800;
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

.suggestion-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.86);
}

.suggestion-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

@media (max-width: 600px) {
  .hand-fan {
    padding: 6px 16px 8px;
  }

  .hand-fan__card {
    margin-left: -20px;
  }

  .play-card {
    min-height: 84px;
  }

  .play-card--back {
    min-height: 46px;
  }

  .hand-fan__card--back {
    width: 38px;
  }
}
</style>
