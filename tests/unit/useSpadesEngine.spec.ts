import { describe, expect, it } from 'vitest'
import { useSpadesEngine, type Card, type Player } from '~/app/composables/games/engines/useSpadesEngine'

const card = (id: string, suit: Card['suit'], rank: Card['rank'], value: number): Card => ({ id, suit, rank, value })

const player = (id: string, name: string, bid: number, tricksWon: number, hand: Card[]): Player => ({
  id,
  name,
  isAI: false,
  hand,
  bid,
  tricksWon,
  score: 0,
})

describe('useSpadesEngine', () => {
  it('refuse les coups invalides quand la couleur demandée est disponible', () => {
    const engine = useSpadesEngine()

    engine.players.value = [
      player('p0', 'Vous', 2, 0, [card('h9', '♥', '9', 9), card('s4', '♠', '4', 4)]),
      player('p1', 'Est', 2, 0, [card('c2', '♣', '2', 2)]),
      player('p2', 'Nord', 2, 0, [card('d3', '♦', '3', 3)]),
      player('p3', 'Ouest', 2, 0, [card('s5', '♠', '5', 5)]),
    ]
    engine.turnIndex.value = 0
    engine.trick.value = [{ playerIndex: 1, card: card('lead-h', '♥', 'K', 13) }]

    const played = engine.applyMove({ type: 'play', playerIndex: 0, cardId: 's4' })

    expect(played).toBe(false)
    expect(engine.players.value[0]?.hand.map(item => item.id)).toContain('s4')
    expect(engine.trick.value).toHaveLength(1)
  })

  it('calcule le score exact en fin de main', () => {
    const engine = useSpadesEngine()

    engine.players.value = [
      player('p0', 'Vous', 4, 2, [card('cA', '♣', 'A', 14)]),
      player('p1', 'Est', 2, 2, []),
      player('p2', 'Nord', 1, 0, []),
      player('p3', 'Ouest', 2, 1, []),
    ]
    engine.turnIndex.value = 0
    engine.trick.value = [
      { playerIndex: 1, card: card('lead-c2', '♣', '2', 2) },
      { playerIndex: 2, card: card('off-d3', '♦', '3', 3) },
      { playerIndex: 3, card: card('off-h4', '♥', '4', 4) },
    ]

    expect(engine.applyMove({ type: 'play', playerIndex: 0, cardId: 'cA' })).toBe(true)
    expect(engine.players.value[0]?.score).toBe(-40)
    expect(engine.players.value[1]?.score).toBe(20)
    expect(engine.players.value[2]?.score).toBe(-10)
    expect(engine.players.value[3]?.score).toBe(-20)
  })

  it('termine correctement une main de spades', () => {
    const engine = useSpadesEngine()

    engine.players.value = [
      player('p0', 'Vous', 1, 0, [card('sA', '♠', 'A', 14)]),
      player('p1', 'Est', 1, 0, []),
      player('p2', 'Nord', 1, 0, []),
      player('p3', 'Ouest', 1, 0, []),
    ]
    engine.turnIndex.value = 0
    engine.trick.value = [
      { playerIndex: 1, card: card('lead-s2', '♠', '2', 2) },
      { playerIndex: 2, card: card('off-d3', '♦', '3', 3) },
      { playerIndex: 3, card: card('off-c4', '♣', '4', 4) },
    ]

    expect(engine.applyMove({ type: 'play', playerIndex: 0, cardId: 'sA' })).toBe(true)
    expect(engine.isHandOver.value).toBe(true)
    expect(engine.handNumber.value).toBe(2)
    expect(engine.message.value).toContain('scores mis à jour')
  })
})
