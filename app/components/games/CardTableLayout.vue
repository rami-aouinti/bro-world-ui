<script setup lang="ts">
import { computed } from "vue";
import GameTableScaffold from "./GameTableScaffold.vue";
const { t } = useI18n();

interface TablePlayer {
  id: string;
  name: string;
  avatar?: string;
  isAI: boolean;
  isCurrentTurn: boolean;
  timerSeconds?: number;
}

interface Props {
  players: TablePlayer[];
  centerCards?: string[];
  centerMelds?: string[][];
  meldsByPlayer?: Partial<Record<"player" | "aiTop" | "aiRight" | "aiLeft", string[][]>>;
  turnTimerSeconds?: number;
}

const props = withDefaults(defineProps<Props>(), {
  centerCards: () => [],
  centerMelds: () => [],
  meldsByPlayer: () => ({}),
  turnTimerSeconds: 120,
});

const seatPositions = computed(() => {
  if (props.players.length >= 6) {
    return ["north", "north-east", "south-east", "south", "south-west", "north-west"] as const;
  }

  return ["north", "east", "south", "west"] as const;
});

const playersWithSeats = computed(() =>
  props.players.slice(0, seatPositions.value.length).map((player, index) => ({
    ...player,
    seat: seatPositions.value[index],
  })),
);

const meldsBySeat = computed(() =>
  playersWithSeats.value.reduce<Record<string, string[][]>>((accumulator, player) => {
    accumulator[player.seat] = props.meldsByPlayer[player.id as keyof typeof props.meldsByPlayer] ?? [];
    return accumulator;
  }, {}),
);

const hasCenterContent = computed(() => props.centerCards.length > 0 || props.centerMelds.length > 0);

const parseCardDisplay = (card: string) => {
  const trimmedCard = card.trim();
  const suit = trimmedCard.slice(-1);
  const rank = trimmedCard.slice(0, -1);
  return { rank, suit };
};

const isRedSuit = (suit: string) => suit === "♥" || suit === "♦";
</script>

<template>
  <GameTableScaffold :players="players" :turn-timer-seconds="turnTimerSeconds">
    <template #surface>
      <section
        v-for="player in playersWithSeats"
        :key="`${player.id}-melds`"
        class="seat-melds"
        :class="`seat-melds--${player.seat}`"
      >
        <div
          v-for="(meld, meldIndex) in meldsBySeat[player.seat] ?? []"
          :key="`${player.id}-meld-${meldIndex}`"
          class="seat-melds__group"
          :class="{
            'seat-melds__group--side': player.seat === 'east' || player.seat === 'west',
            'seat-melds__group--east': player.seat === 'east',
            'seat-melds__group--west': player.seat === 'west',
          }"
        >
          <span
            v-for="(cardParts, cardIndex) in meld.map(parseCardDisplay)"
            :key="`${player.id}-meld-${meldIndex}-card-${cardIndex}`"
            class="meld-card"
            :class="{
              'meld-card--red': isRedSuit(cardParts.suit),
              'meld-card--black': !isRedSuit(cardParts.suit),
            }"
          >
            <span class="meld-card__corner">{{ cardParts.rank }}{{ cardParts.suit }}</span>
            <span class="meld-card__center">{{ cardParts.suit }}</span>
            <span class="meld-card__corner meld-card__corner--bottom">{{ cardParts.rank }}{{ cardParts.suit }}</span>
          </span>
        </div>
      </section>

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
        <p v-else class="text-caption mb-0 text-medium-emphasis">{{ t("gameComponents.cardTable.emptyTable") }}</p>
      </slot>
    </template>

    <template #player-hands>
      <div class="table-seat-hand table-seat-hand--north"><slot name="seat-north-hand" /></div>
      <div class="table-seat-hand table-seat-hand--east"><slot name="seat-east-hand" /></div>
      <div class="table-seat-hand table-seat-hand--south"><slot name="seat-south-hand" /></div>
      <div class="table-seat-hand table-seat-hand--west"><slot name="seat-west-hand" /></div>
    </template>

    <slot />

    <template #aside>
      <slot name="aside" />
    </template>
  </GameTableScaffold>
</template>

<style scoped>
.seat-melds { position: absolute; z-index: 2; display: flex; flex-direction: column; gap: 4px; width: min(230px, 46%); padding: 10px; overflow-y: auto; }
.seat-melds--north { top: 75px; left: 50%; transform: translateX(-50%); align-items: center; }
.seat-melds--south { bottom: 76px; left: 50%; transform: translateX(-50%); align-items: center; }
.seat-melds--east { top: 50%; right: 100px; width: min(150px, 24%); transform: translateY(-52%); align-items: flex-end; z-index: 3; }
.seat-melds--west { top: 50%; left: 100px; width: min(150px, 24%); transform: translateY(-52%); align-items: flex-start; z-index: 3; }
.seat-melds__group { display: flex; flex-wrap: wrap; gap: 4px; }
.seat-melds__group--side { flex-direction: column; flex-wrap: nowrap; gap: 6px; }
.seat-melds__group--east .meld-card { transform: rotate(8deg); }
.seat-melds__group--west .meld-card { transform: rotate(-8deg); }
.meld-card { display: inline-flex; flex-direction: column; justify-content: space-between; align-items: flex-start; width: 28px; min-height: 40px; border-radius: 6px; border: 1px solid rgba(15, 23, 42, 0.15); padding: 3px 4px; background: linear-gradient(160deg, #fff, #f6f7fb); box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18); line-height: 1; }
.meld-card--red { color: #dc2626; }
.meld-card--black { color: #111827; }
.meld-card__corner { font-size: 0.5rem; font-weight: 700; letter-spacing: 0.01em; }
.meld-card__corner--bottom { align-self: flex-end; transform: rotate(180deg); }
.meld-card__center { align-self: center; font-size: 0.9rem; }
.table-seat-hand { position: absolute; z-index: 1; width: min(520px, calc(100% - 36px)); }
.table-seat-hand--north { top: 96px; left: 50%; transform: translateX(-50%); }
.table-seat-hand--south { bottom: 60px; left: 50%; transform: translateX(-50%); }
.table-seat-hand--east { top: 50%; right: 86px; width: min(100px, 20%); transform: translateY(-50%); }
.table-seat-hand--west { top: 50%; left: 86px; width: min(100px, 20%); transform: translateY(-50%); }
.center-fallback, .center-fallback__column { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.center-fallback__row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.center-fallback__card { padding: 4px 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.9); color: #1f2937; font-weight: 700; }

@media (max-width: 960px) {
  .table-seat-hand--north { top: 108px; width: min(460px, calc(100% - 32px)); }
  .table-seat-hand--south { bottom: 152px; width: min(460px, calc(100% - 32px)); }
  .table-seat-hand--east, .table-seat-hand--west { top: auto; bottom: 20px; transform: none; width: calc(50% - 24px); }
  .table-seat-hand--east { right: 12px; }
  .table-seat-hand--west { left: 12px; }
  .seat-melds--south { bottom: 130px; }
  .seat-melds--east { right: 12px; width: calc(50% - 24px); top: auto; bottom: 184px; transform: none; }
  .seat-melds--west { left: 12px; width: calc(50% - 24px); top: auto; bottom: 184px; transform: none; }
}

@media (max-width: 600px) {
  .table-seat-hand--north { top: 104px; width: calc(100% - 24px); }
  .table-seat-hand--south { bottom: 236px; width: calc(100% - 24px); }
  .table-seat-hand--east, .table-seat-hand--west { bottom: 12px; width: calc(50% - 18px); }
  .seat-melds { width: calc(100% - 132px); max-height: 68px; }
  .seat-melds--north { top: 75px; }
  .seat-melds--south { bottom: 210px; }
  .seat-melds--east { left: auto; right: 12px; width: calc(50% - 18px); bottom: 170px; }
  .seat-melds--west { left: 12px; width: calc(50% - 18px); bottom: 170px; }
}
</style>
