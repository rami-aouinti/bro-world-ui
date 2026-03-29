<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  selectedPlayMode: 'ai' | 'pvp'
}>()

const { t } = useI18n()

type Player = 'red' | 'black'

interface Piece {
  player: Player
  king: boolean
}

type Cell = Piece | null

type Board = Cell[][]

interface Position {
  row: number
  col: number
}

const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if ((row + col) % 2 === 0) {
        continue
      }

      if (row <= 2) {
        board[row][col] = { player: 'black', king: false }
      }
      else if (row >= 5) {
        board[row][col] = { player: 'red', king: false }
      }
    }
  }

  return board
}

const currentPlayerLabel = (player: Player) => player === 'red'
  ? t('gameComponents.checkers.players.redTurn')
  : t('gameComponents.checkers.players.blackTurn')

const winnerLabel = (player: Player) => player === 'red'
  ? t('gameComponents.checkers.players.redWin')
  : t('gameComponents.checkers.players.blackWin')

const board = ref<Board>(createInitialBoard())
const currentPlayer = ref<Player>('red')
const selected = ref<Position | null>(null)
const message = ref(currentPlayerLabel('red'))
const isThinking = ref(false)

const hasInside = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8

const pieceAt = (position: Position) => board.value[position.row][position.col]

const movementDirections = (piece: Piece) => {
  if (piece.king) {
    return [1, -1]
  }

  return piece.player === 'red' ? [-1] : [1]
}

const availableMoves = (position: Position) => {
  const piece = pieceAt(position)
  if (!piece) {
    return [] as Array<{ to: Position, capture?: Position }>
  }

  const moves: Array<{ to: Position, capture?: Position }> = []

  for (const rowDir of movementDirections(piece)) {
    for (const colDir of [-1, 1]) {
      const nextRow = position.row + rowDir
      const nextCol = position.col + colDir

      if (!hasInside(nextRow, nextCol)) {
        continue
      }

      const nextCell = board.value[nextRow][nextCol]
      if (!nextCell) {
        moves.push({ to: { row: nextRow, col: nextCol } })
        continue
      }

      if (nextCell.player === piece.player) {
        continue
      }

      const jumpRow = nextRow + rowDir
      const jumpCol = nextCol + colDir
      if (!hasInside(jumpRow, jumpCol) || board.value[jumpRow][jumpCol]) {
        continue
      }

      moves.push({
        to: { row: jumpRow, col: jumpCol },
        capture: { row: nextRow, col: nextCol },
      })
    }
  }

  return moves
}

const highlightedMoves = computed(() => selected.value ? availableMoves(selected.value) : [])

const isHighlighted = (row: number, col: number) => highlightedMoves.value.some(move => move.to.row === row && move.to.col === col)

const switchTurn = () => {
  currentPlayer.value = currentPlayer.value === 'red' ? 'black' : 'red'
  message.value = currentPlayerLabel(currentPlayer.value)
}

const winner = computed(() => {
  const pieces = board.value.flat().filter(Boolean) as Piece[]
  const redCount = pieces.filter(piece => piece.player === 'red').length
  const blackCount = pieces.filter(piece => piece.player === 'black').length

  if (!redCount) {
    return 'black'
  }

  if (!blackCount) {
    return 'red'
  }

  return null
})

const clickCell = (row: number, col: number) => {
  if (
    winner.value
    || isThinking.value
    || (props.selectedPlayMode === 'ai' && currentPlayer.value === 'black')
  ) {
    return
  }

  const clickedPiece = board.value[row][col]
  if (clickedPiece && clickedPiece.player !== currentPlayer.value) {
    return
  }

  if (clickedPiece && clickedPiece.player === currentPlayer.value) {
    selected.value = { row, col }
    return
  }

  if (!selected.value) {
    return
  }

  const move = highlightedMoves.value.find(item => item.to.row === row && item.to.col === col)
  if (!move) {
    return
  }

  const from = selected.value
  const movingPiece = board.value[from.row][from.col]
  if (!movingPiece) {
    selected.value = null
    return
  }

  board.value[from.row][from.col] = null
  board.value[row][col] = movingPiece

  if (move.capture) {
    board.value[move.capture.row][move.capture.col] = null
  }

  if (movingPiece.player === 'red' && row === 0) {
    movingPiece.king = true
  }
  if (movingPiece.player === 'black' && row === 7) {
    movingPiece.king = true
  }

  selected.value = null

  if (winner.value) {
    message.value = winnerLabel(winner.value)
    return
  }

  switchTurn()
}

const reset = () => {
  board.value = createInitialBoard()
  currentPlayer.value = 'red'
  selected.value = null
  message.value = currentPlayerLabel('red')
}
</script>

<template>
  <v-card class="pa-4 rounded-xl game-card-shell" variant="tonal">
    <div class="d-flex align-center justify-space-between mb-3">
      <h3 class="game-title mb-0">{{ t("gameComponents.checkers.title") }}</h3>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">{{ t("gameComponents.checkers.actions.restart") }}</v-btn>
    </div>

    <p class="game-subtitle mb-4">{{ message }}</p>

    <div class="checkers-board mx-auto">
      <button
        v-for="(cell, index) in board.flat()"
        :key="index"
        type="button"
        class="checkers-cell"
        :class="{
          'checkers-cell--dark': Math.floor(index / 8) % 2 !== index % 8,
          'checkers-cell--selected': selected && selected.row === Math.floor(index / 8) && selected.col === index % 8,
          'checkers-cell--highlight': isHighlighted(Math.floor(index / 8), index % 8),
        }"
        @click="clickCell(Math.floor(index / 8), index % 8)"
      >
        <span
          v-if="cell"
          class="piece"
          :class="{
            'piece--red': cell.player === 'red',
            'piece--black': cell.player === 'black',
            'piece--king': cell.king,
          }"
        >
          <v-icon v-if="cell.king" icon="mdi-crown" size="16" />
        </span>
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

.game-title {
  font-size: 1.2rem;
  font-weight: 800;
}

.game-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.checkers-board {
  width: min(520px, 100%);
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

.checkers-cell {
  aspect-ratio: 1;
  border: none;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 84%, #f3e7d3 16%);
  display: grid;
  place-items: center;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.checkers-cell--dark {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 45%, #7f6546 55%);
}

.checkers-cell:hover {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, rgb(var(--v-theme-primary)) 24%, transparent);
}

.checkers-cell:focus-visible {
  outline: 3px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 40%, transparent);
  outline-offset: -3px;
}

.checkers-cell--selected {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: -3px;
}

.checkers-cell--highlight {
  box-shadow: inset 0 0 0 3px rgb(var(--v-theme-secondary));
}

.piece {
  width: 72%;
  height: 72%;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: white;
  box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.22);
}

.piece--red {
  background: linear-gradient(145deg, #ff7f7f, #c0392b);
}

.piece--black {
  background: linear-gradient(145deg, #595959, #161616);
}

.piece--king {
  border: 2px solid #ffd54f;
}
</style>
