<script setup lang="ts">
import PlayingCard from './PlayingCard.vue'

interface TrickPlay {
  seat: 'north' | 'east' | 'south' | 'west'
  rank: string
  suit: string
  playerName?: string
  won?: boolean
}

const props = withDefaults(defineProps<{
  trick: TrickPlay[]
  winnerSeat?: TrickPlay['seat'] | null
}>(), {
  winnerSeat: null,
})

const slotsOrder: TrickPlay['seat'][] = ['north', 'east', 'south', 'west']

const playBySeat = (seat: TrickPlay['seat']) => props.trick.find((play) => play.seat === seat)
</script>

<template>
  <div class="trick-pile" role="group" aria-label="Pli central">
    <div v-for="seat in slotsOrder" :key="seat" class="trick-pile__slot" :class="`trick-pile__slot--${seat}`">
      <PlayingCard
        v-if="playBySeat(seat)"
        :rank="playBySeat(seat)?.rank"
        :suit="playBySeat(seat)?.suit"
        :highlighted="winnerSeat === seat"
        :feedback="winnerSeat === seat ? 'won' : 'idle'"
        :playable="false"
        :disabled="true"
        :hoverable="false"
        :label="`${playBySeat(seat)?.playerName ?? seat} ${playBySeat(seat)?.rank}${playBySeat(seat)?.suit}`"
      />
      <div v-else class="trick-pile__empty" aria-hidden="true">—</div>
    </div>
  </div>
</template>
