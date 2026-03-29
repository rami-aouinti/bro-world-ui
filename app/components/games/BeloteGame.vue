<script setup lang="ts">
import { computed, ref } from 'vue'

defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = '7' | '8' | '9' | 'J' | 'Q' | 'K' | '10' | 'A'

interface Card {
  id: string
  suit: Suit
  rank: Rank
}

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

const createDeck = (): Card[] => suits.flatMap(suit => ranks.map(rank => ({ id: `${suit}-${rank}`, suit, rank })))

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

const trumpSuit = ref<Suit>('♠')
const playerHand = ref<Card[]>([])
const aiHand = ref<Card[]>([])
const playerCard = ref<Card | null>(null)
const aiCard = ref<Card | null>(null)
const playerScore = ref(0)
const aiScore = ref(0)
const trickCount = ref(0)
const message = ref('Choisissez une carte pour jouer un pli.')

const trickWinner = (lead: Card, follow: Card) => {
  if (lead.suit === follow.suit) {
    const leadPower = lead.suit === trumpSuit.value ? trumpStrength[lead.rank] : normalStrength[lead.rank]
    const followPower = follow.suit === trumpSuit.value ? trumpStrength[follow.rank] : normalStrength[follow.rank]
    return leadPower >= followPower ? 'lead' : 'follow'
  }

  if (follow.suit === trumpSuit.value && lead.suit !== trumpSuit.value) {
    return 'follow'
  }

  return 'lead'
}

const canPlay = computed(() => trickCount.value < 8 && playerCard.value === null)

const playCard = (card: Card) => {
  if (!canPlay.value) {
    return
  }

  playerCard.value = card
  playerHand.value = playerHand.value.filter(item => item.id !== card.id)

  const aiChoice = aiHand.value[Math.floor(Math.random() * aiHand.value.length)]
  aiCard.value = aiChoice
  aiHand.value = aiHand.value.filter(item => item.id !== aiChoice.id)

  const winner = trickWinner(card, aiChoice)
  const points = cardPoints[card.rank] + cardPoints[aiChoice.rank]

  if (winner === 'lead') {
    playerScore.value += points
    message.value = `Vous gagnez ce pli (+${points}).`
  }
  else {
    aiScore.value += points
    message.value = `Belote IA gagne ce pli (+${points}).`
  }

  trickCount.value += 1

  if (trickCount.value >= 8) {
    if (playerScore.value > aiScore.value) {
      message.value = `Partie terminée: vous gagnez ${playerScore.value} à ${aiScore.value}.`
    }
    else if (playerScore.value < aiScore.value) {
      message.value = `Partie terminée: l'IA gagne ${aiScore.value} à ${playerScore.value}.`
    }
    else {
      message.value = `Partie terminée: égalité ${playerScore.value}-${aiScore.value}.`
    }
  }
}

const nextTrick = () => {
  playerCard.value = null
  aiCard.value = null
}

const restart = () => {
  const freshDeck = shuffle(createDeck())
  playerHand.value = freshDeck.slice(0, 8)
  aiHand.value = freshDeck.slice(8, 16)
  trumpSuit.value = suits[Math.floor(Math.random() * suits.length)]
  playerCard.value = null
  aiCard.value = null
  playerScore.value = 0
  aiScore.value = 0
  trickCount.value = 0
  message.value = 'Nouvelle manche de belote. À vous de jouer !'
}

restart()
</script>

<template>
  <v-card class="pa-4 rounded-xl game-card-shell" variant="tonal">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <h3 class="game-title mb-0">Belote (version rapide)</h3>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="restart">Nouvelle donne</v-btn>
    </div>

    <p class="game-description mb-1">Atout: <strong>{{ trumpSuit }}</strong></p>
    <p class="game-subtitle mb-4">Plis joués: {{ trickCount }} / 8 · Score vous {{ playerScore }} - IA {{ aiScore }}</p>

    <div class="d-flex flex-wrap ga-3 mb-4">
      <v-card class="pa-3 flex-grow-1 game-info-card" min-width="220" variant="outlined">
        <p class="text-subtitle-2 font-weight-bold mb-2">Pli en cours</p>
        <p class="mb-1">Vous: <strong>{{ playerCard ? `${playerCard.rank}${playerCard.suit}` : '—' }}</strong></p>
        <p class="mb-2">IA: <strong>{{ aiCard ? `${aiCard.rank}${aiCard.suit}` : '—' }}</strong></p>
        <v-btn :disabled="!playerCard || !aiCard || trickCount >= 8" size="small" variant="text" @click="nextTrick">Pli suivant</v-btn>
      </v-card>

      <v-card class="pa-3 flex-grow-1 game-info-card" min-width="220" variant="outlined">
        <p class="text-subtitle-2 font-weight-bold mb-2">Instruction</p>
        <p class="game-subtitle mb-0">{{ message }}</p>
      </v-card>
    </div>

    <p class="text-subtitle-2 font-weight-bold mb-2">Votre main</p>
    <div class="belote-card-grid">
      <button
        v-for="card in playerHand"
        :key="card.id"
        type="button"
        class="play-card"
        :disabled="!canPlay"
        @click="playCard(card)"
      >
        <span>{{ card.rank }}</span>
        <span :class="card.suit === '♥' || card.suit === '♦' ? 'text-red' : 'text-black'">{{ card.suit }}</span>
      </button>
    </div>
  </v-card>
</template>

<style scoped>
.game-card-shell {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, transparent);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.09);
}

.game-info-card {
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-info)) 22%, transparent);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 95%, rgb(var(--v-theme-info)) 5%);
}

.game-title {
  font-size: 1.2rem;
  font-weight: 800;
}

.game-description {
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.game-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.76);
  font-size: 0.93rem;
}

.belote-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.play-card {
  min-height: 82px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 26%, transparent);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-primary)) 8%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.play-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
}

.play-card:focus-visible {
  outline: 3px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 40%, transparent);
  outline-offset: 2px;
}

.play-card:disabled {
  opacity: 0.5;
}
</style>
