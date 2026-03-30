<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { usePokerEngine } from '~/composables/games/usePokerEngine'

defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

const { t } = useI18n()

const engine = usePokerEngine()
const raiseToTotal = ref(engine.getMinimumRaiseToTotal(engine.currentTurnIndex.value))

let aiTimeout: ReturnType<typeof setTimeout> | null = null

const currentPlayer = computed(() => engine.players.value[engine.currentTurnIndex.value])
const isHumanTurn = computed(() => currentPlayer.value?.id === engine.humanPlayer.value?.id)

const playerCallAmount = computed(() => {
  const player = engine.humanPlayer.value
  if (!player) return 0
  return Math.min(player.stack, Math.max(0, engine.currentBet.value - player.currentBet))
})

const canCheck = computed(() => playerCallAmount.value === 0)
const canCall = computed(() => playerCallAmount.value > 0 && (engine.humanPlayer.value?.stack ?? 0) > 0)
const canRaise = computed(() => {
  const player = engine.humanPlayer.value
  if (!player) return false

  const minimum = engine.getMinimumRaiseToTotal(0)
  const maximum = engine.getMaximumRaiseToTotal(0)
  return minimum <= maximum && maximum > engine.currentBet.value
})

const minRaiseToTotal = computed(() => engine.getMinimumRaiseToTotal(0))
const maxRaiseToTotal = computed(() => engine.getMaximumRaiseToTotal(0))

const boardCards = computed(() => {
  const slots = [0, 1, 2, 3, 4]
  return slots.map((slot) => {
    const card = engine.board.value[slot]
    return card ? engine.formatCard(card) : '🂠'
  })
})

const streetLabel = computed(() => {
  const key = engine.street.value
  return t(`gameComponents.poker.states.${key}`)
})

const setRaiseWithinBounds = () => {
  if (!canRaise.value) {
    raiseToTotal.value = engine.currentBet.value
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

  const player = engine.players.value[engine.currentTurnIndex.value]
  if (!player?.isAI || engine.street.value === 'hand-over') return

  aiTimeout = setTimeout(() => {
    engine.runAiAction()
  }, 650)
})

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
      <v-chip color="primary" variant="flat">{{ t('gameComponents.poker.handNumber', { count: engine.handNumber }) }}</v-chip>
    </div>

    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-chip>{{ t('gameComponents.poker.statesLabel') }}: {{ streetLabel }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.pot') }}: {{ engine.pot }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.currentBet') }}: {{ engine.currentBet }}</v-chip>
      <v-chip>{{ t('gameComponents.poker.turn') }}: {{ currentPlayer?.name ?? '—' }}</v-chip>
    </div>

    <v-row class="mb-2" dense>
      <v-col cols="12" md="7">
        <v-card class="pa-3 h-100" variant="outlined">
          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('gameComponents.poker.board') }}</p>
          <div class="board-row mb-2">
            <span v-for="(card, index) in boardCards" :key="`board-${index}`" class="table-card">{{ card }}</span>
          </div>
          <p class="text-caption text-medium-emphasis mb-0">{{ engine.actionMessage }}</p>
          <div v-if="engine.showdownSummary.length" class="mt-3 d-grid ga-1">
            <p class="text-caption font-weight-bold mb-0">{{ t('gameComponents.poker.showdown') }}</p>
            <p v-for="(line, index) in engine.showdownSummary" :key="`show-${index}`" class="mb-0 text-caption">{{ line }}</p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="pa-3 h-100" variant="outlined">
          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('gameComponents.poker.yourCards') }}</p>
          <div class="board-row mb-3">
            <span v-for="card in engine.humanPlayer?.hand ?? []" :key="card.id" class="table-card">{{ engine.formatCard(card) }}</span>
          </div>

          <div class="d-grid ga-2">
            <v-btn color="error" variant="outlined" :disabled="!isHumanTurn || engine.street === 'hand-over'" @click="perform('fold')">
              {{ t('gameComponents.poker.actions.fold') }}
            </v-btn>
            <v-btn color="secondary" variant="outlined" :disabled="!isHumanTurn || !canCheck || engine.street === 'hand-over'" @click="perform('check')">
              {{ t('gameComponents.poker.actions.check') }}
            </v-btn>
            <v-btn color="info" variant="outlined" :disabled="!isHumanTurn || !canCall || engine.street === 'hand-over'" @click="perform('call')">
              {{ t('gameComponents.poker.actions.call') }} {{ canCall ? `(${playerCallAmount})` : '' }}
            </v-btn>

            <div>
              <label class="text-caption d-block mb-1">{{ t('gameComponents.poker.actions.raise') }}: {{ raiseToTotal }}</label>
              <v-slider
                v-model="raiseToTotal"
                :min="minRaiseToTotal"
                :max="maxRaiseToTotal"
                :step="10"
                :disabled="!isHumanTurn || !canRaise || engine.street === 'hand-over'"
                hide-details
              />
              <v-btn color="primary" class="mt-1" block :disabled="!isHumanTurn || !canRaise || engine.street === 'hand-over'" @click="perform('raise')">
                {{ t('gameComponents.poker.actions.raise') }}
              </v-btn>
            </div>
          </div>

          <v-btn v-if="engine.street === 'hand-over'" color="primary" prepend-icon="mdi-refresh" class="mt-3" @click="startNextHand">
            {{ t('gameComponents.poker.actions.nextHand') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-3" variant="outlined">
      <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('gameComponents.poker.players') }}</p>
      <div class="players-grid">
        <div
          v-for="(player, index) in engine.players"
          :key="player.id"
          class="player-chip"
          :class="{ 'player-chip--active': engine.currentTurnIndex === index }"
        >
          <div class="d-flex justify-space-between ga-2">
            <strong>{{ player.name }}</strong>
            <span>{{ t(player.isAI ? 'gameComponents.poker.aiStatus.ai' : 'gameComponents.poker.aiStatus.human') }}</span>
          </div>
          <div class="text-caption mt-1">
            {{ t('gameComponents.poker.stack') }}: {{ player.stack }} · {{ t('gameComponents.poker.bet') }}: {{ player.currentBet }}
          </div>
          <div class="text-caption">
            {{ player.folded ? t('gameComponents.poker.states.folded') : (player.allIn ? t('gameComponents.poker.states.allIn') : t('gameComponents.poker.states.active')) }}
          </div>
        </div>
      </div>
    </v-card>
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

.table-card {
  min-width: 54px;
  min-height: 76px;
  border-radius: 10px;
  border: 1px solid rgba(17, 24, 39, 0.2);
  background: #fff;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.player-chip {
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 10px;
  padding: 8px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, rgb(var(--v-theme-primary)) 6%);
}

.player-chip--active {
  border-color: rgba(76, 175, 80, 0.7);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
</style>
