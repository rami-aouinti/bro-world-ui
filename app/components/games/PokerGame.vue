<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
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
const flyingChips = ref<Array<{
  id: number
  fromSeat: number
  amount: number
  count: number
  phase: 'start' | 'end'
}>>([])
let chipAnimationId = 0

const tablePlayers = computed(() => players.value.map((player, index) => ({
  id: player.id,
  name: player.name,
  isAI: player.isAI,
  handCount: player.hand.length,
  stack: player.stack,
  currentBet: player.currentBet,
  lastAction: player.lastAction,
  seatIndex: index,
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
const getActionFeedback = (action?: string | null) => {
  if (!action) return ''
  const normalizedAction = action.toLowerCase()
  if (normalizedAction === 'fold') return 'Fold'
  if (normalizedAction === 'check') return 'Check'
  if (normalizedAction === 'call') return 'Call'
  if (normalizedAction === 'raise') return 'Raise'
  return action
}

const getChipVisualCount = (amount: number) => {
  if (amount <= 0) return 0
  return Math.min(12, Math.max(1, Math.round(amount / 20)))
}

const createFlyingChips = (fromSeat: number, amount: number) => {
  if (amount <= 0) return

  const id = ++chipAnimationId
  const chip = {
    id,
    fromSeat,
    amount,
    count: getChipVisualCount(amount),
    phase: 'start' as const,
  }

  flyingChips.value.push(chip)

  nextTick(() => {
    const activeChip = flyingChips.value.find(entry => entry.id === id)
    if (activeChip) {
      activeChip.phase = 'end'
    }
  })

  setTimeout(() => {
    flyingChips.value = flyingChips.value.filter(entry => entry.id !== id)
  }, 850)
}

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

watch(
  () => ({
    pot: pot.value,
    currentBet: currentBet.value,
    playerBets: players.value.map((player, index) => ({
      id: player.id,
      seat: index,
      currentBet: player.currentBet,
    })),
  }),
  (next, previous) => {
    if (!previous) return

    next.playerBets.forEach((playerBet, index) => {
      const previousBet = previous.playerBets[index]
      if (!previousBet) return
      const delta = playerBet.currentBet - previousBet.currentBet
      if (delta > 0) {
        createFlyingChips(playerBet.seat, delta)
      }
    })

    const potDelta = next.pot - previous.pot
    const currentBetDelta = next.currentBet - previous.currentBet

    if (potDelta > 0 && currentBetDelta > 0) {
      createFlyingChips(currentTurnIndex.value, Math.max(potDelta, currentBetDelta))
    }
  },
)

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

    <CardTableLayout :players="tablePlayers" :center-cards="centerCards" class="poker-table-layout">
      <template #center>
        <div class="poker-table-surface">
          <div class="poker-rail">
            <div class="poker-pot-zone">
              <div class="pot-stack">
                <p class="pot-stack__label mb-1">{{ t('gameComponents.poker.pot') }}</p>
                <div class="chip-stack chip-stack--pot" aria-hidden="true">
                  <span v-for="chipIndex in getChipVisualCount(pot)" :key="`pot-chip-${chipIndex}`" class="chip-stack__chip" />
                </div>
                <strong class="pot-stack__amount">{{ pot }}</strong>
              </div>
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
            </div>
          </div>
          <div class="flying-chips-layer" aria-hidden="true">
            <div
              v-for="chip in flyingChips"
              :key="chip.id"
              class="flying-chip"
              :class="[`flying-chip--seat-${chip.fromSeat}`, { 'flying-chip--end': chip.phase === 'end' }]"
            >
              <span v-for="tokenIndex in chip.count" :key="`${chip.id}-token-${tokenIndex}`" class="chip-stack__chip chip-stack__chip--small" />
            </div>
          </div>
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
              <div class="chip-stack mb-1" aria-hidden="true">
                <span v-for="chipIndex in getChipVisualCount(player.stack)" :key="`${player.id}-stack-${chipIndex}`" class="chip-stack__chip" />
              </div>
              <p class="text-caption mb-1 text-medium-emphasis">Action: {{ player.lastAction ?? '—' }} · Mise: {{ player.currentBet }}</p>
              <p v-if="currentPlayer?.id === player.id && player.lastAction" class="action-feedback mb-1">
                {{ getActionFeedback(player.lastAction) }}
              </p>
              <div class="card-back-row">
                <span v-for="n in player.hand.length" :key="`${player.id}-${n}`" class="card-back">🂠</span>
              </div>
            </article>
          </div>
        </v-card>

        <v-card class="pa-3" variant="outlined">
          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('gameComponents.poker.yourCards') }}</p>
          <p class="text-caption text-medium-emphasis mb-2">Jetons: {{ humanPlayer?.stack ?? 0 }} · Votre mise: {{ humanPlayer?.currentBet ?? 0 }}</p>
          <div class="chip-stack mb-2" aria-hidden="true">
            <span v-for="chipIndex in getChipVisualCount(humanPlayer?.stack ?? 0)" :key="`human-stack-${chipIndex}`" class="chip-stack__chip" />
          </div>
          <p v-if="currentPlayer?.id === humanPlayer?.id && humanPlayer?.lastAction" class="action-feedback mb-2">
            {{ getActionFeedback(humanPlayer.lastAction) }}
          </p>
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

.poker-table-surface {
  position: relative;
  width: min(100%, 700px);
  margin-inline: auto;
  padding: 18px;
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(104, 239, 168, 0.28) 0%, rgba(9, 39, 21, 0.52) 72%);
  box-shadow:
    inset 0 0 40px rgba(8, 30, 18, 0.54),
    0 12px 24px rgba(6, 20, 12, 0.35);
}

.poker-rail {
  position: relative;
  border-radius: 999px;
  padding: 20px;
  border: 2px solid rgba(17, 10, 6, 0.72);
  background: linear-gradient(165deg, rgba(21, 10, 5, 0.78) 0%, rgba(8, 4, 2, 0.92) 100%);
  box-shadow:
    inset 0 1px 2px rgba(255, 228, 184, 0.12),
    inset 0 -2px 8px rgba(0, 0, 0, 0.55),
    0 8px 20px rgba(0, 0, 0, 0.4);
}

.poker-pot-zone {
  position: relative;
  border-radius: 999px;
  padding: 18px 22px;
  background:
    radial-gradient(circle at center, rgba(250, 255, 205, 0.28) 0%, rgba(53, 138, 83, 0.12) 36%, rgba(7, 30, 19, 0) 70%),
    radial-gradient(circle at center, rgba(42, 143, 79, 0.5) 0%, rgba(24, 100, 58, 0.65) 85%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pot-stack {
  position: absolute;
  left: 50%;
  top: -10px;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 4px;
}

.pot-stack__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(248, 250, 252, 0.82);
}

.pot-stack__amount {
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.95);
}

.chip-stack {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-height: 12px;
}

.chip-stack--pot {
  gap: 1px;
}

.chip-stack__chip {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #ef4444 35%, #7f1d1d 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}

.chip-stack__chip--small {
  width: 8px;
  height: 8px;
}

.flying-chips-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.flying-chip {
  position: absolute;
  display: flex;
  gap: 2px;
  opacity: 0.95;
  transition: transform 700ms ease, opacity 700ms ease;
}

.flying-chip--end {
  transform: translate(calc(50% - var(--chip-x)), calc(50% - var(--chip-y))) scale(0.8);
  opacity: 0;
}

.flying-chip--seat-0 { --chip-x: 15%; --chip-y: 82%; left: 15%; top: 82%; }
.flying-chip--seat-1 { --chip-x: 84%; --chip-y: 74%; left: 84%; top: 74%; }
.flying-chip--seat-2 { --chip-x: 84%; --chip-y: 24%; left: 84%; top: 24%; }
.flying-chip--seat-3 { --chip-x: 15%; --chip-y: 24%; left: 15%; top: 24%; }
.flying-chip--seat-4 { --chip-x: 50%; --chip-y: 12%; left: 50%; top: 12%; }
.flying-chip--seat-5 { --chip-x: 50%; --chip-y: 88%; left: 50%; top: 88%; }

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

.action-feedback {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #fff;
  background: color-mix(in srgb, rgb(var(--v-theme-warning)) 70%, rgba(0, 0, 0, 0.45));
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
  box-shadow:
    0 12px 20px rgba(5, 8, 18, 0.32),
    0 2px 6px rgba(8, 12, 24, 0.2);
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

.poker-table-layout :deep(.card-table-layout__center) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.poker-table-layout :deep(.table-seat) {
  background: rgba(5, 12, 7, 0.52);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 0 10px 20px rgba(4, 10, 6, 0.35);
}

.poker-table-layout :deep(.table-seat--active) {
  border-color: color-mix(in srgb, rgb(var(--v-theme-warning)) 72%, #fff);
  box-shadow:
    0 0 0 2px color-mix(in srgb, rgb(var(--v-theme-warning)) 42%, transparent),
    0 0 16px color-mix(in srgb, rgb(var(--v-theme-warning)) 45%, transparent);
}

.poker-table-layout :deep(.table-seat--active .v-avatar) {
  box-shadow: 0 0 0 3px rgba(255, 241, 118, 0.38);
}
</style>
