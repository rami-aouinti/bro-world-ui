<script setup lang="ts">
import { computed, ref } from 'vue'

defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

const { t } = useI18n()

type Suit = '♠' | '♥' | '♦' | '♣'

interface Card {
  id: string
  suit: Suit
  rank: number
}

const suits: Suit[] = ['♠', '♥', '♦', '♣']

const rankLabels: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
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

const hand = ref<Card[]>([])
const selectedCardIds = ref<string[]>([])
const melds = ref<Card[][]>([])
const score = ref(0)
const message = ref(t('gameComponents.rami.messages.createCombinations'))

const formatRank = (rank: number) => rankLabels[rank] ?? String(rank)

const reset = () => {
  const randomDeck = shuffle(deck())
  hand.value = randomDeck.slice(0, 10)
  selectedCardIds.value = []
  melds.value = []
  score.value = 0
  message.value = t('gameComponents.rami.messages.newGame')
}

const isSelected = (cardId: string) => selectedCardIds.value.includes(cardId)

const toggleCard = (cardId: string) => {
  if (isSelected(cardId)) {
    selectedCardIds.value = selectedCardIds.value.filter(id => id !== cardId)
    return
  }

  selectedCardIds.value.push(cardId)
}

const selectedCards = computed(() => hand.value.filter(card => selectedCardIds.value.includes(card.id)))

const isSet = (cards: Card[]) => {
  if (cards.length < 3) {
    return false
  }

  const ranks = new Set(cards.map(card => card.rank))
  const suitsCount = new Set(cards.map(card => card.suit)).size
  return ranks.size === 1 && suitsCount === cards.length
}

const isRun = (cards: Card[]) => {
  if (cards.length < 3) {
    return false
  }

  const sameSuit = new Set(cards.map(card => card.suit)).size === 1
  if (!sameSuit) {
    return false
  }

  const orderedRanks = cards.map(card => card.rank).sort((left, right) => left - right)
  for (let index = 1; index < orderedRanks.length; index += 1) {
    if (orderedRanks[index] !== orderedRanks[index - 1] + 1) {
      return false
    }
  }

  return true
}

const canCreateMeld = computed(() => isSet(selectedCards.value) || isRun(selectedCards.value))

const createMeld = () => {
  if (!canCreateMeld.value) {
    message.value = t('gameComponents.rami.messages.invalidCombination')
    return
  }

  const cardsToMove = [...selectedCards.value]
  melds.value.push(cardsToMove)
  const selected = new Set(selectedCardIds.value)
  hand.value = hand.value.filter(card => !selected.has(card.id))
  selectedCardIds.value = []
  score.value += cardsToMove.length * 10
  message.value = hand.value.length === 0
    ? t('gameComponents.rami.messages.allCardsPlayed')
    : t('gameComponents.rami.messages.goodCombination')
}

const drawCard = () => {
  const usedIds = new Set([...hand.value, ...melds.value.flat()].map(card => card.id))
  const remaining = shuffle(deck().filter(card => !usedIds.has(card.id)))

  if (!remaining.length) {
    message.value = t('gameComponents.rami.messages.deckEmpty')
    return
  }

  hand.value.push(remaining[0])
  message.value = t('gameComponents.rami.messages.cardDrawn')
}

reset()
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
    <div>
      <h3 class="game-title mb-1">{{ t("gameComponents.rami.title") }}</h3>
      <p class="game-subtitle mb-0">{{ t("gameComponents.rami.score") }}: <strong>{{ score }}</strong></p>
    </div>
    <div class="d-flex ga-2">
      <v-btn variant="outlined" prepend-icon="mdi-cards" @click="drawCard">{{ t("gameComponents.rami.actions.draw") }}</v-btn>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">{{ t("gameComponents.rami.actions.playAgain") }}</v-btn>
    </div>
  </div>

  <p class="game-description mb-3">{{ message }}</p>

  <h4 class="text-subtitle-1 mb-2 font-weight-bold">{{ t("gameComponents.rami.hand") }}</h4>
  <div class="game-card-grid mb-4">
    <button
        v-for="card in hand"
        :key="card.id"
        type="button"
        class="play-card"
        :class="{ 'play-card--selected': isSelected(card.id) }"
        @click="toggleCard(card.id)"
    >
      <span class="text-h6">{{ formatRank(card.rank) }}</span>
      <span :class="card.suit === '♥' || card.suit === '♦' ? 'text-red' : 'text-black'">{{ card.suit }}</span>
    </button>
  </div>

  <v-btn :disabled="!selectedCards.length" color="secondary" variant="outlined" class="mb-4" @click="createMeld">
    {{ t("gameComponents.rami.actions.playCombination", { count: selectedCards.length }) }}
  </v-btn>

  <h4 class="text-subtitle-1 mb-2 font-weight-bold">{{ t("gameComponents.rami.melds") }}</h4>
  <div v-if="melds.length" class="d-flex flex-column ga-2">
    <div v-for="(meld, index) in melds" :key="`meld-${index}`" class="d-flex ga-2 flex-wrap">
      <v-chip v-for="card in meld" :key="card.id" size="small" variant="outlined">
        {{ formatRank(card.rank) }}{{ card.suit }}
      </v-chip>
    </div>
  </div>
  <p v-else class="game-subtitle mb-0">{{ t("gameComponents.rami.noMeld") }}</p>
</template>

<style scoped>
.game-card-shell {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, transparent);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.09);
}

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
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}

.play-card {
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 26%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-primary)) 8%);
  min-height: 92px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.play-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
}

.play-card:focus-visible {
  outline: 3px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 40%, transparent);
  outline-offset: 2px;
}

.play-card--selected {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.14);
}
</style>
