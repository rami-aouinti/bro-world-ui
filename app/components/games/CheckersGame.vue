<script setup lang="ts">
import { computed, ref } from 'vue'

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

const board = ref<Board>(createInitialBoard())
const currentPlayer = ref<Player>('red')
const selected = ref<Position | null>(null)
const message = ref('Tour du joueur rouge.')

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
  message.value = currentPlayer.value === 'red' ? 'Tour du joueur rouge.' : 'Tour du joueur noir.'
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
  if (winner.value) {
    return
  }

  const clickedPiece = board.value[row][col]
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
    message.value = winner.value === 'red' ? 'Le joueur rouge gagne !' : 'Le joueur noir gagne !'
    return
  }

  switchTurn()
}

const reset = () => {
  board.value = createInitialBoard()
  currentPlayer.value = 'red'
  selected.value = null
  message.value = 'Tour du joueur rouge.'
}
</script>

<template>
  <v-card class="pa-4 rounded-xl" variant="tonal">
    <div class="d-flex align-center justify-space-between mb-3">
      <h3 class="text-h6 mb-0">Jeu de dames</h3>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="reset">Recommencer</v-btn>
    </div>

    <p class="text-body-2 mb-4">{{ message }}</p>

    <div class="checkers-board mx-auto">
      <button
        v-for="(cell, index) in board.flat()"
        :key="index"
        type="button"
        class="checkers-cell"
        :class="{
          'checkers-cell--dark': Math.floor(index / 8) % 2 !== index % 2,
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
.checkers-board {
  width: min(520px, 100%);
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.checkers-cell {
  aspect-ratio: 1;
  border: none;
  background: #f3e7d3;
  display: grid;
  place-items: center;
}

.checkers-cell--dark {
  background: #7f6546;
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
}

.piece--red {
  background: #d32f2f;
}

.piece--black {
  background: #212121;
}

.piece--king {
  box-shadow: 0 0 0 3px #ffca28 inset;
}
</style>
