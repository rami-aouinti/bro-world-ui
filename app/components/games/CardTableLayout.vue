<script setup lang="ts">
import { computed } from 'vue'

interface TablePlayer {
  id: string
  name: string
  avatar?: string
  isAI: boolean
  handCount: number
  isCurrentTurn: boolean
  timerSeconds?: number
}

interface Props {
  players: TablePlayer[]
  centerCards?: string[]
  centerMelds?: string[][]
  turnTimerSeconds?: number
}

const props = withDefaults(defineProps<Props>(), {
  centerCards: () => [],
  centerMelds: () => [],
  turnTimerSeconds: 120,
})

const seatPositions = computed(() => {
  if (props.players.length >= 6) {
    return ['north', 'north-east', 'south-east', 'south', 'south-west', 'north-west'] as const
  }

  return ['north', 'east', 'south', 'west'] as const
})

const playersWithSeats = computed(() => props.players.slice(0, seatPositions.value.length).map((player, index) => ({
  ...player,
  seat: seatPositions.value[index],
  displayedTimer: player.isCurrentTurn ? (player.timerSeconds ?? props.turnTimerSeconds) : null,
})))

const hasCenterContent = computed(() => props.centerCards.length > 0 || props.centerMelds.length > 0)
</script>

<template>
  <div class="card-table-layout">
    <div class="card-table-layout__table">
      <article
        v-for="player in playersWithSeats"
        :key="player.id"
        class="table-seat"
        :class="[`table-seat--${player.seat}`, { 'table-seat--active': player.isCurrentTurn }]"
      >
        <v-avatar :image="player.avatar" size="38" color="primary" variant="tonal">
          <span class="text-caption font-weight-bold">{{ player.name.slice(0, 2).toUpperCase() }}</span>
        </v-avatar>
        <div class="table-seat__meta">
          <p class="table-seat__name mb-0">{{ player.name }}</p>
          <p class="table-seat__details mb-0">
            {{ player.isAI ? 'IA' : 'Joueur' }} · {{ player.handCount }} cartes
          </p>
        </div>
        <v-chip size="x-small" color="white" variant="flat" class="table-seat__timer">
          <v-icon start icon="mdi-timer-outline" size="14" />
          {{ player.displayedTimer !== null ? `${player.displayedTimer}s` : '—' }}
        </v-chip>
      </article>

      <section class="card-table-layout__center">
        <slot name="center">
          <div v-if="hasCenterContent" class="center-fallback">
            <div v-if="centerCards.length" class="center-fallback__row">
              <span v-for="(card, index) in centerCards" :key="`center-card-${index}`" class="center-fallback__card">{{ card }}</span>
            </div>
            <div v-if="centerMelds.length" class="center-fallback__column">
              <div v-for="(meld, meldIndex) in centerMelds" :key="`center-meld-${meldIndex}`" class="center-fallback__row">
                <span v-for="(card, cardIndex) in meld" :key="`center-meld-${meldIndex}-${cardIndex}`" class="center-fallback__card">{{ card }}</span>
              </div>
            </div>
          </div>
          <p v-else class="text-caption mb-0 text-medium-emphasis">Aucun pli/combinaison sur la table.</p>
        </slot>
      </section>
    </div>

    <section class="card-table-layout__content">
      <slot />
    </section>
  </div>
</template>

<style scoped>
.card-table-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-table-layout__table {
  position: relative;
  min-height: 480px;
  border-radius: 24px;
  background: radial-gradient(circle at center, #2a8f4f 0%, #18643a 75%);
  border: 2px solid rgba(255, 255, 255, 0.24);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.08), 0 14px 32px rgba(12, 31, 20, 0.28);
  overflow: hidden;
}

.table-seat {
  position: absolute;
  width: 170px;
  min-height: 76px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 14px;
  background: rgba(8, 19, 12, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
}

.table-seat--active {
  border-color: rgba(255, 235, 59, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.25);
}

.table-seat--north { top: 16px; left: 50%; transform: translateX(-50%); }
.table-seat--east { top: 50%; right: 16px; transform: translateY(-50%); }
.table-seat--south { bottom: 16px; left: 50%; transform: translateX(-50%); }
.table-seat--west { top: 50%; left: 16px; transform: translateY(-50%); }
.table-seat--north-east { top: 54px; right: 26px; }
.table-seat--south-east { bottom: 54px; right: 26px; }
.table-seat--south-west { bottom: 54px; left: 26px; }
.table-seat--north-west { top: 54px; left: 26px; }

.table-seat__name {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.1;
}

.table-seat__details {
  font-size: 0.74rem;
  opacity: 0.9;
}

.table-seat__timer {
  grid-column: 1 / -1;
  justify-self: start;
  background: rgba(255, 255, 255, 0.92) !important;
}

.card-table-layout__center {
  position: absolute;
  inset: 140px 180px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.32);
  background: rgba(3, 9, 6, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  color: #fff;
}

.center-fallback,
.center-fallback__column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.center-fallback__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.center-fallback__card {
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  font-weight: 700;
}

.card-table-layout__content {
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 22%, transparent);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 96%, rgb(var(--v-theme-primary)) 4%);
  padding: 14px;
}

@media (max-width: 960px) {
  .card-table-layout__table {
    min-height: 560px;
  }

  .card-table-layout__center {
    inset: 170px 24px 170px;
  }

  .table-seat--east,
  .table-seat--west {
    top: auto;
    transform: none;
    bottom: 106px;
  }

  .table-seat--east { right: 12px; }
  .table-seat--west { left: 12px; }
}
</style>
