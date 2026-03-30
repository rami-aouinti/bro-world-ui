<script setup lang="ts">
import { computed } from 'vue'
import CardTableLayout from './CardTableLayout.vue'
import { type BeloteMode, useBeloteEngine } from '~/composables/games/useBeloteEngine'

const props = defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
  beloteMode: BeloteMode
}>()

const { t } = useI18n()

const engine = useBeloteEngine(() => props.beloteMode)

const isHumanCardPlayable = (cardId: string) => engine.humanPlayableCards.value.some(card => card.id === cardId)

const tablePlayers = computed(() => engine.players.value.map((player, index) => ({
  id: player.id,
  name: player.name,
  isAI: player.isAI,
  handCount: player.hand.length,
  isCurrentTurn: engine.turnIndex.value === index,
  timerSeconds: engine.turnIndex.value === index ? engine.timerSeconds.value : undefined,
})))

const centerCards = computed(() => engine.trick.value.map(play => `${engine.players.value[play.playerIndex].name}: ${play.card.rank}${play.card.suit}`))

const scoreboardRows = computed(() => {
  if (props.beloteMode === 'teams') {
    return [
      { id: 'team-a', label: 'Équipe A (Vous + IA Nord)', score: engine.teamScores.value.teamA },
      { id: 'team-b', label: 'Équipe B (IA Est + IA Ouest)', score: engine.teamScores.value.teamB },
    ]
  }

  return engine.players.value.map((player, index) => ({
    id: player.id,
    label: player.name,
    score: engine.playerScores.value[index],
  }))
})

const modeLabel = computed(() => (props.beloteMode === 'teams' ? '2v2' : 'Free-for-all'))
</script>

<template>
  <v-card class="pa-4 rounded-xl game-card-shell" variant="tonal">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <h3 class="game-title mb-0">{{ t("gameComponents.belote.title") }} · {{ modeLabel }}</h3>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="engine.restartRound">{{ t("gameComponents.belote.actions.newDeal") }}</v-btn>
    </div>

    <p class="game-description mb-1">{{ t("gameComponents.belote.trump") }}: <strong>{{ engine.trumpSuit }}</strong></p>
    <p class="game-subtitle mb-4">
      {{ t("gameComponents.belote.tricksPlayed", { count: engine.trickCount }) }} · Tour: {{ engine.players[engine.turnIndex]?.name ?? '—' }} · Timer: {{ engine.timerSeconds }}s
    </p>

    <CardTableLayout :players="tablePlayers" :center-cards="centerCards" :turn-timer-seconds="engine.TURN_SECONDS">
      <template #center>
        <div class="trick-center">
          <p class="text-caption text-medium-emphasis mb-2">Pli central</p>
          <div class="trick-center__cards">
            <div v-for="slot in [0, 1, 2, 3]" :key="`trick-slot-${slot}`" class="center-card">
              <template v-if="engine.trick.find(play => play.playerIndex === slot)">
                <span>{{ engine.trick.find(play => play.playerIndex === slot)?.card.rank }}</span>
                <span :class="['card-suit', engine.trick.find(play => play.playerIndex === slot)?.card.suit === '♥' || engine.trick.find(play => play.playerIndex === slot)?.card.suit === '♦' ? 'text-red' : 'text-black']">{{ engine.trick.find(play => play.playerIndex === slot)?.card.suit }}</span>
              </template>
              <span v-else class="text-medium-emphasis">—</span>
            </div>
          </div>
        </div>
      </template>

      <v-row class="mb-4" dense>
        <v-col cols="12" md="6">
          <v-card class="pa-3 game-info-card h-100" variant="outlined">
            <p class="text-subtitle-2 font-weight-bold mb-2">Scores</p>
            <div class="d-flex flex-column ga-1">
              <p v-for="entry in scoreboardRows" :key="entry.id" class="mb-0">{{ entry.label }}: <strong>{{ entry.score }}</strong></p>
            </div>
            <p class="mb-0 mt-2">{{ engine.roundOver ? engine.roundResult : engine.message }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-3 game-info-card h-100" variant="outlined">
            <p class="text-subtitle-2 font-weight-bold mb-2">Mains IA</p>
            <div class="ai-hands">
              <div v-for="(player, index) in engine.players.slice(1)" :key="player.id" class="ai-hand-row">
                <span class="text-caption">{{ player.name }}</span>
                <div class="card-backs">
                  <span v-for="n in player.hand.length" :key="`${player.id}-${n}`" class="card-back">🂠</span>
                </div>
                <small class="text-medium-emphasis">{{ index === 1 ? 'Partenaire' : 'Adversaire' }}</small>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <p class="text-subtitle-2 font-weight-bold mb-2">{{ t("gameComponents.belote.yourHand") }}</p>
      <div class="belote-card-grid">
        <button
          v-for="card in engine.players[0]?.hand ?? []"
          :key="card.id"
          type="button"
          class="play-card"
          :disabled="!engine.canHumanPlay || !isHumanCardPlayable(card.id)"
          @click="engine.playCard(0, card.id)"
        >
          <span>{{ card.rank }}</span>
          <span :class="card.suit === '♥' || card.suit === '♦' ? 'text-red' : 'text-black'">{{ card.suit }}</span>
        </button>
      </div>
    </CardTableLayout>
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

.ai-hands {
  display: grid;
  gap: 8px;
}

.ai-hand-row {
  display: grid;
  gap: 4px;
}

.card-backs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 30px;
  border-radius: 6px;
  background: rgba(30, 58, 138, 0.15);
  border: 1px solid rgba(30, 58, 138, 0.28);
}

.trick-center {
  width: 100%;
}

.trick-center__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(40px, 1fr));
  gap: 8px;
}

.center-card {
  min-height: 52px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  border: 1px solid rgba(17, 24, 39, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>
