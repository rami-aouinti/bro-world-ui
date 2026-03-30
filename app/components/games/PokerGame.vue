<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { PokerCard } from '~/composables/games/usePokerEngine'
import { usePokerEngine } from '~/composables/games/usePokerEngine'

defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

const { t } = useI18n()

const engine = usePokerEngine()
const raiseToTotal = ref(engine.getMinimumRaiseToTotal(engine.currentTurnIndex.value))

let aiTimeout: ReturnType<typeof setTimeout> | null = null

const handNumber = computed(() => engine.handNumber.value)
const street = computed(() => engine.street.value)
const pot = computed(() => engine.pot.value)
const currentBet = computed(() => engine.currentBet.value)
const players = computed(() => engine.players.value)
const humanPlayer = computed(() => engine.humanPlayer.value)
const currentTurnIndex = computed(() => engine.currentTurnIndex.value)
const showdownSummary = computed(() => engine.showdownSummary.value)
const actionMessage = computed(() => engine.actionMessage.value)

const currentPlayer = computed(() => players.value[currentTurnIndex.value])
const isHumanTurn = computed(() => currentPlayer.value?.id === humanPlayer.value?.id)

const tablePlayers = computed(() => players.value.map((player, index) => ({
  id: player.id,
  name: player.name,
  isAI: player.isAI,
  handCount: player.hand.length,
  isCurrentTurn: street.value !== 'hand-over' && currentTurnIndex.value === index,
})))

const opponents = computed(() => players.value.filter(player => player.id !== humanPlayer.value?.id))

const revealedBoardCards = computed(() => {
  if (street.value === 'preflop' || street.value === 'hand-over') return 0
  if (street.value === 'flop') return 3
  if (street.value === 'turn') return 4
  return 5
})

const boardSlots = computed(() => Array.from({ length: 5 }, (_, index) => {
  const card = engine.board.value[index]
  return {
    key: `board-${index}`,
    card,
    isVisible: index < revealedBoardCards.value && Boolean(card),
  }
}))

const centerCards = computed(() => boardSlots.value
  .filter(slot => slot.isVisible && slot.card)
  .map(slot => engine.formatCard(slot.card as PokerCard)))

const playerCallAmount = computed(() => {
  const player = humanPlayer.value
  if (!player) return 0
  return Math.min(player.stack, Math.max(0, currentBet.value - player.currentBet))
})

const canCheck = computed(() => playerCallAmount.value === 0)
const canCall = computed(() => playerCallAmount.value > 0 && (humanPlayer.value?.stack ?? 0) > 0)
const canRaise = computed(() => {
  const player = humanPlayer.value
  if (!player) return false

  const minimum = engine.getMinimumRaiseToTotal(0)
  const maximum = engine.getMaximumRaiseToTotal(0)
  return minimum <= maximum && maximum > currentBet.value
})

const minRaiseToTotal = computed(() => engine.getMinimumRaiseToTotal(0))
const maxRaiseToTotal = computed(() => engine.getMaximumRaiseToTotal(0))

const streetLabel = computed(() => {
  const key = street.value
  return t(`gameComponents.poker.states.${key}`)
})

const getCardTone = (cardLabel: string) => {
  if (/♥|♦/.test(cardLabel)) return 'table-card--red'
  if (/♣|♠/.test(cardLabel)) return 'table-card--black'
  return 'table-card--back'
}

const getCardRank = (cardLabel: string) => cardLabel.replace(/[♠♥♦♣]/g, '')
const getCardSuit = (cardLabel: string) => cardLabel.match(/[♠♥♦♣]/)?.[0] ?? ''

const formatCard = (card: PokerCard) => engine.formatCard(card)

const setRaiseWithinBounds = () => {
  if (!canRaise.value) {
    raiseToTotal.value = currentBet.value
    return
  }

  raiseToTotal.value = Math.min(maxRaiseToTotal.value, Math.max(minRaiseToTotal.value, raiseToTotal.value))
}

watch([() => engine.currentTurnIndex.value, () => engine.currentBet.value, () => engine.street.value], () => {
  setRaiseWithinBounds()

  if (aiTimeout) {
    clearTimeout(aiTimeout)
    aiTimeout = null
  }

  const player = players.value[currentTurnIndex.value]
  if (!player?.isAI || street.value === 'hand-over') return

  aiTimeout = setTimeout(() => {
    engine.runAiAction()
  }, 650)
}, { immediate: true })

const perform = (action: 'fold' | 'check' | 'call' | 'raise') => {
  if (!isHumanTurn.value) return

  if (action === 'raise') {
    engine.performAction(0, 'raise', raiseToTotal.value)
    return
  }

  engine.performAction(0, action)
}

const startNextHand = () => {
  engine.startNewHand()
  setRaiseWithinBounds()
}

onBeforeUnmount(() => {
  if (aiTimeout) {
    clearTimeout(aiTimeout)
  }
})
</script>

<template>
  <v-card class="pa-4 rounded-xl poker-shell" variant="tonal">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <h3 class="game-title mb-0">{{ t('gameComponents.poker.title') }}</h3>
      <v-chip color="primary" variant="flat">{{ t('gameComponents.poker.handNumber', { count: handNumber }) }}</v-chip>
    </div>

    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-chip>{{ t('gameComponents.poker.statesLabel') }}: {{ streetLabel }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.pot') }}: {{ pot }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.currentBet') }}: {{ currentBet }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.turn') }}: {{ currentPlayer?.name ?? '—' }}</v-chip>
    </div>

    <CardTableLayout :players="tablePlayers" :center-cards="centerCards">
      <template #center>
        <div class="board-row board-row--center">
          <span
            v-for="slot in boardSlots"
            :key="slot.key"
            class="table-card"
            :class="slot.isVisible && slot.card ? getCardTone(formatCard(slot.card)) : 'table-card--back'"
          >
            <template v-if="slot.isVisible && slot.card">
              <span class="table-card__rank">{{ getCardRank(formatCard(slot.card)) }}</span>
              <span class="table-card__suit">{{ getCardSuit(formatCard(slot.card)) }}</span>
            </template>
            <template v-else>
              <span class="table-card__back-pattern">🂠</span>
            </template>
          </span>
        </div>
      </template>

      <div class="d-grid ga-3">
        <v-card class="pa-3" variant="outlined">
          <p class="text-subtitle-2 font-weight-bold mb-2">Table (jetons / statut)</p>
          <div class="opponent-grid">
            <article v-for="player in opponents" :key="player.id" class="opponent-card" :class="{ 'opponent-card--active': currentPlayer?.id === player.id }">
              <div class="d-flex align-center justify-space-between ga-2 mb-1">
                <strong class="text-body-2">{{ player.name }}</strong>
                <v-chip size="x-small" color="secondary" variant="tonal">{{ player.stack }} jetons</v-chip>
              </div>
              <p class="text-caption mb-1 text-medium-emphasis">Action: {{ player.lastAction ?? '—' }} · Mise: {{ player.currentBet }}</p>
              <div class="card-back-row">
                <span v-for="n in player.hand.length" :key="`${player.id}-${n}`" class="card-back">🂠</span>
              </div>
            </article>
          </div>
        </v-card>

        <v-card class="pa-3" variant="outlined">
          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('gameComponents.poker.yourCards') }}</p>
          <p class="text-caption text-medium-emphasis mb-2">Jetons: {{ humanPlayer?.stack ?? 0 }} · Votre mise: {{ humanPlayer?.currentBet ?? 0 }}</p>
          <div class="board-row mb-3">
            <span
              v-for="card in humanPlayer?.hand ?? []"
              :key="card.id"
              class="table-card"
              :class="getCardTone(formatCard(card))"
            >
              <span class="table-card__rank">{{ getCardRank(formatCard(card)) }}</span>
              <span class="table-card__suit">{{ getCardSuit(formatCard(card)) }}</span>
            </span>
          </div>

          <div class="d-grid ga-2">
            <v-btn color="error" variant="outlined" :disabled="!isHumanTurn || street === 'hand-over'" @click="perform('fold')">
              {{ t('gameComponents.poker.actions.fold') }}
            </v-btn>
            <v-btn color="secondary" variant="outlined" :disabled="!isHumanTurn || !canCheck || street === 'hand-over'" @click="perform('check')">
              {{ t('gameComponents.poker.actions.check') }}
            </v-btn>
            <v-btn color="info" variant="outlined" :disabled="!isHumanTurn || !canCall || street === 'hand-over'" @click="perform('call')">
              {{ t('gameComponents.poker.actions.call') }} {{ canCall ? `(${playerCallAmount})` : '' }}
            </v-btn>

            <div>
              <label class="text-caption d-block mb-1">{{ t('gameComponents.poker.actions.raise') }}: {{ raiseToTotal }}</label>
              <v-slider
                v-model="raiseToTotal"
                :min="minRaiseToTotal"
                :max="maxRaiseToTotal"
                :step="10"
                :disabled="!isHumanTurn || !canRaise || street === 'hand-over'"
                hide-details
              />
              <v-btn color="primary" class="mt-1" block :disabled="!isHumanTurn || !canRaise || street === 'hand-over'" @click="perform('raise')">
                {{ t('gameComponents.poker.actions.raise') }}
              </v-btn>
            </div>
          </div>

          <v-btn v-if="street === 'hand-over'" color="primary" prepend-icon="mdi-refresh" class="mt-3" @click="startNextHand">
            {{ t('gameComponents.poker.actions.nextHand') }}
          </v-btn>
        </v-card>

        <v-card class="pa-3" variant="outlined">
          <p class="text-caption text-medium-emphasis mb-0">{{ actionMessage }}</p>
          <div v-if="showdownSummary.length" class="mt-3 d-grid ga-1">
            <p class="text-caption font-weight-bold mb-0">{{ t('gameComponents.poker.showdown') }}</p>
            <p v-for="(line, index) in showdownSummary" :key="`show-${index}`" class="mb-0 text-caption">{{ line }}</p>
          </div>
        </v-card>
      </div>
    </CardTableLayout>
  </v-card>
</template>

<style scoped>
.poker-shell {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, transparent);
}

.game-title {
  font-size: 1.2rem;
  font-weight: 800;
}

.board-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.board-row--center {
  justify-content: center;
}

.opponent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.opponent-card {
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 24%, transparent);
  border-radius: 10px;
  padding: 8px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, rgb(var(--v-theme-primary)) 6%);
}

.opponent-card--active {
  border-color: color-mix(in srgb, rgb(var(--v-theme-warning)) 60%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, rgb(var(--v-theme-warning)) 25%, transparent);
}

.card-back-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid rgba(30, 58, 138, 0.25);
  background: rgba(30, 58, 138, 0.12);
}

.table-card {
  position: relative;
  min-width: 58px;
  min-height: 84px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.25);
  background: linear-gradient(180deg, #ffffff 0%, #f5f7ff 100%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
}

.table-card--red {
  color: #b91c1c;
}

.table-card--black {
  color: #111827;
}

.table-card--back {
  background: linear-gradient(150deg, #1e3a8a 0%, #172554 100%);
  border-color: rgba(255, 255, 255, 0.3);
  color: #e5edff;
}

.table-card__rank {
  font-size: 1.1rem;
  line-height: 1;
}

.table-card__suit {
  font-size: 1.2rem;
  line-height: 1;
}

.table-card__back-pattern {
  font-size: 1.35rem;
  opacity: 0.9;
}
</style>
