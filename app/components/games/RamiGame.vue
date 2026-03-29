<script setup lang="ts">
import { computed, ref } from 'vue'

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
const message = ref('Créez des combinaisons de 3 cartes ou plus (suite ou brelan).')

const formatRank = (rank: number) => rankLabels[rank] ?? String(rank)

const reset = () => {
  const randomDeck = shuffle(deck())
  hand.value = randomDeck.slice(0, 10)
  selectedCardIds.value = []
  melds.value = []
  score.value = 0
  message.value = 'Nouvelle partie. Faites des suites ou des brelans.'
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
    message.value = 'Combinaison invalide. Essayez une suite de même couleur ou un brelan.'
    return
  }

  const cardsToMove = [...selectedCards.value]
  melds.value.push(cardsToMove)
  const selected = new Set(selectedCardIds.value)
  hand.value = hand.value.filter(card => !selected.has(card.id))
  selectedCardIds.value = []
  score.value += cardsToMove.length * 10
  message.value = hand.value.length === 0
    ? 'Bravo ! Vous avez posé toutes vos cartes.'
    : 'Bonne combinaison. Continuez !'
}

const drawCard = () => {
  const usedIds = new Set([...hand.value, ...melds.value.flat()].map(card => card.id))
  const remaining = shuffle(deck().filter(card => !usedIds.has(card.id)))

  if (!remaining.length) {
    message.value = 'Le paquet est vide.'
    return
  }

  hand.value.push(remaining[0])
  message.value = 'Carte piochée.'
}

reset()
</script>

<template>
  <v-card class="pa-4 rounded-xl" variant="tonal">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <h3 class="text-h6 mb-1">Rami</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">Score: <strong>{{ score }}</strong></p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" prepend-icon="mdi-cards" @click="drawCard">Piocher</v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">Rejouer</v-btn>
      </div>
    </div>

    <p class="text-body-2 mb-3">{{ message }}</p>

    <h4 class="text-subtitle-1 mb-2">Main</h4>
    <div class="game-card-grid mb-4">
      <button
        v-for="card in hand"
        :key="card.id"
        type="button"
        class="rami-card"
        :class="{ 'rami-card--selected': isSelected(card.id) }"
        @click="toggleCard(card.id)"
      >
        <span class="text-h6">{{ formatRank(card.rank) }}</span>
        <span :class="card.suit === '♥' || card.suit === '♦' ? 'text-red' : 'text-black'">{{ card.suit }}</span>
      </button>
    </div>

    <v-btn :disabled="!selectedCards.length" color="secondary" variant="outlined" class="mb-4" @click="createMeld">
      Poser la combinaison ({{ selectedCards.length }})
    </v-btn>

    <h4 class="text-subtitle-1 mb-2">Combinaisons posées</h4>
    <div v-if="melds.length" class="d-flex flex-column ga-2">
      <div v-for="(meld, index) in melds" :key="`meld-${index}`" class="d-flex ga-2 flex-wrap">
        <v-chip v-for="card in meld" :key="card.id" size="small" variant="outlined">
          {{ formatRank(card.rank) }}{{ card.suit }}
        </v-chip>
      </div>
    </div>
    <p v-else class="text-body-2 text-medium-emphasis mb-0">Aucune combinaison pour le moment.</p>
  </v-card>
</template>

<style scoped>
.game-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}

.rami-card {
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  min-height: 92px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.15s ease;
}

.rami-card--selected {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}
</style>
