<script setup lang="ts">
import { computed } from 'vue'
import { useChessEngine } from '~/composables/games/useChessEngine'

const props = defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

const {
  board,
  currentTurn,
  selectedSquare,
  legalTargets,
  moveHistory,
  winner,
  statusMessage,
  isAiThinking,
  isInCheck,
  selectSquare,
  reset,
  formatHistoryMove,
} = useChessEngine(props.selectedPlayMode)

const pieceGlyph: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
}

const boardRows = computed(() =>
  board.value.map((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      piece: cell,
    })),
  ),
)

const cellClasses = (row: number, col: number) => ({
  'chess-cell': true,
  'chess-cell--dark': (row + col) % 2 === 1,
  'chess-cell--selected': Boolean(selectedSquare.value && selectedSquare.value.row === row && selectedSquare.value.col === col),
  'chess-cell--target': legalTargets.value.some(target => target.row === row && target.col === col),
})

const cellLabel = (row: number, col: number) => `${String.fromCharCode(97 + col)}${8 - row}`

const sideLabel = computed(() => currentTurn.value === 'white' ? 'Blancs' : 'Noirs')
</script>

<template>
  <v-card class="pa-4 chess-card" variant="outlined">
    <div class="d-flex flex-wrap justify-space-between align-center ga-2 mb-3">
      <div>
        <h3 class="text-h6 mb-1">Jeu d'échecs</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ statusMessage }}</p>
      </div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip color="info" variant="tonal">Tour : {{ sideLabel }}</v-chip>
        <v-chip v-if="isInCheck && !winner" color="warning" variant="flat">Échec</v-chip>
        <v-chip v-if="props.selectedPlayMode === 'ai'" color="deep-purple" variant="outlined">Mode IA</v-chip>
        <v-btn size="small" prepend-icon="mdi-refresh" variant="tonal" @click="reset">Nouvelle partie</v-btn>
      </div>
    </div>

    <v-alert
      v-if="isAiThinking"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      L'IA réfléchit...
    </v-alert>

    <div class="chess-layout">
      <div class="chess-board" role="grid" aria-label="Plateau d'échecs">
        <button
          v-for="cell in boardRows.flat()"
          :key="`cell-${cell.row}-${cell.col}`"
          type="button"
          :class="cellClasses(cell.row, cell.col)"
          @click="selectSquare({ row: cell.row, col: cell.col })"
        >
          <span class="chess-cell__coord">{{ cellLabel(cell.row, cell.col) }}</span>
          <span v-if="cell.piece" class="chess-piece">
            {{ pieceGlyph[`${cell.piece.color}-${cell.piece.type}`] }}
          </span>
          <span v-else-if="legalTargets.some(target => target.row === cell.row && target.col === cell.col)" class="chess-target-dot" />
        </button>
      </div>

      <div class="chess-history">
        <h4 class="text-subtitle-1 mb-2">Historique des coups</h4>
        <ol class="history-list">
          <li
            v-for="(move, index) in moveHistory"
            :key="`move-${index}`"
            class="history-item"
          >
            <span class="text-caption text-medium-emphasis mr-2">{{ index + 1 }}.</span>
            <span>{{ formatHistoryMove(move) }}</span>
          </li>
        </ol>
        <p v-if="!moveHistory.length" class="text-body-2 text-medium-emphasis mb-0">
          Aucun coup pour le moment.
        </p>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.chess-card {
  border-radius: 16px;
}

.chess-layout {
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(220px, 1fr);
  gap: 1rem;
  align-items: start;
}

.chess-board {
  display: grid;
  grid-template-columns: repeat(8, minmax(36px, 1fr));
  border: 2px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.chess-cell {
  position: relative;
  aspect-ratio: 1;
  border: none;
  cursor: pointer;
  background: #f2e2c2;
  color: #2a2a2a;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.chess-cell:hover {
  box-shadow: inset 0 0 0 2px rgba(var(--v-theme-primary), 0.35);
}

.chess-cell--dark {
  background: #ad7a4f;
  color: #fff;
}

.chess-cell--selected {
  box-shadow: inset 0 0 0 3px rgba(var(--v-theme-info), 0.9);
}

.chess-cell--target {
  box-shadow: inset 0 0 0 3px rgba(var(--v-theme-success), 0.85);
}

.chess-piece {
  font-size: clamp(1.25rem, 2.3vw, 2rem);
  line-height: 1;
}

.chess-cell__coord {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 0.58rem;
  opacity: 0.62;
}

.chess-target-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.8);
  display: inline-block;
}

.chess-history {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 10px;
  padding: 0.75rem;
  max-height: 520px;
  overflow: auto;
}

.history-list {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.35rem;
}

.history-item {
  font-size: 0.92rem;
}

@media (max-width: 1024px) {
  .chess-layout {
    grid-template-columns: 1fr;
  }
}
</style>
