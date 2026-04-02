import { describe, expect, it } from 'vitest'
import { useSolitaireEngine, type Card } from '~/app/composables/games/engines/useSolitaireEngine'

const card = (
  id: string,
  suit: Card['suit'],
  rank: Card['rank'],
  value: number,
  color: Card['color'],
  faceUp = true,
): Card => ({ id, suit, rank, value, color, faceUp })

describe('useSolitaireEngine', () => {
  it('refuse les coups invalides', () => {
    const engine = useSolitaireEngine()

    engine.stock.value = []
    engine.waste.value = [card('w-1', '♦', '9', 9, 'red')]
    engine.tableau.value = [[], [], [], [], [], [], []]

    const result = engine.applyMove({ type: 'waste-to-tableau', toPile: 0, cardId: 'inconnu' })

    expect(result).toBe(false)
    expect(engine.waste.value).toHaveLength(1)
    expect(engine.moveCount.value).toBe(0)
  })

  it('calcule le score exact selon les fondations', () => {
    const engine = useSolitaireEngine()

    engine.stock.value = []
    engine.waste.value = [card('ace-hearts', '♥', 'A', 1, 'red')]
    engine.foundations.value = [[], [], [], []]
    engine.tableau.value = [[], [], [], [], [], [], []]

    expect(engine.applyMove({ type: 'waste-to-foundation', cardId: 'ace-hearts' })).toBe(true)
    expect(engine.score.value).toBe(10)

    engine.waste.value = [card('two-hearts', '♥', '2', 2, 'red')]
    expect(engine.applyMove({ type: 'waste-to-foundation', cardId: 'two-hearts' })).toBe(true)
    expect(engine.score.value).toBe(20)
  })

  it('détecte correctement la fin de partie', () => {
    const engine = useSolitaireEngine()

    engine.foundations.value = [
      Array.from({ length: 13 }, (_, index) => card(`s-${index}`, '♠', 'A', 1, 'black')),
      Array.from({ length: 13 }, (_, index) => card(`h-${index}`, '♥', 'A', 1, 'red')),
      Array.from({ length: 13 }, (_, index) => card(`d-${index}`, '♦', 'A', 1, 'red')),
      Array.from({ length: 13 }, (_, index) => card(`c-${index}`, '♣', 'A', 1, 'black')),
    ]

    expect(engine.isWon.value).toBe(true)
    expect(engine.score.value).toBe(520)
  })
})
