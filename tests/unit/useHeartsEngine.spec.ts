import { describe, expect, it } from 'vitest'
import { useHeartsEngine, type Card, type Player } from '~/app/composables/games/engines/useHeartsEngine'

const card = (id: string, suit: Card['suit'], rank: Card['rank'], value: number): Card => ({ id, suit, rank, value })

const player = (id: string, name: string, hand: Card[]): Player => ({
  id,
  name,
  isAI: false,
  hand,
  score: 0,
  tricksWon: 0,
})

describe('useHeartsEngine', () => {
  it('refuse une carte invalide si la couleur demandée est disponible', () => {
    const engine = useHeartsEngine()

    engine.players.value = [
      player('p0', 'Vous', [card('h2', '♥', '2', 2), card('s4', '♠', '4', 4)]),
      player('p1', 'Est', [card('c5', '♣', '5', 5)]),
      player('p2', 'Nord', [card('d6', '♦', '6', 6)]),
      player('p3', 'Ouest', [card('s7', '♠', '7', 7)]),
    ]
    engine.turnIndex.value = 0
    engine.trick.value = [{ playerIndex: 1, card: card('lead-h', '♥', '9', 9) }]

    const played = engine.applyMove({ type: 'play', playerIndex: 0, cardId: 's4' })

    expect(played).toBe(false)
    expect(engine.players.value[0]?.hand.map(item => item.id)).toContain('s4')
    expect(engine.trick.value).toHaveLength(1)
  })

  it('calcule le score exact du pli', () => {
    const engine = useHeartsEngine()

    engine.players.value = [
      player('p0', 'Vous', [card('sA', '♠', 'A', 14)]),
      player('p1', 'Est', [card('h2', '♥', '2', 2)]),
      player('p2', 'Nord', [card('h3', '♥', '3', 3)]),
      player('p3', 'Ouest', [card('qS', '♠', 'Q', 12)]),
    ]
    engine.turnIndex.value = 0
    engine.trick.value = [
      { playerIndex: 1, card: card('lead-s2', '♠', '2', 2) },
      { playerIndex: 2, card: card('heart-1', '♥', '4', 4) },
      { playerIndex: 3, card: card('heart-2', '♥', '5', 5) },
    ]

    expect(engine.applyMove({ type: 'play', playerIndex: 0, cardId: 'sA' })).toBe(true)
    expect(engine.players.value[0]?.score).toBe(2)
    expect(engine.players.value[0]?.tricksWon).toBe(1)
  })

  it('termine correctement une main', () => {
    const engine = useHeartsEngine()

    engine.players.value = [
      player('p0', 'Vous', [card('sA', '♠', 'A', 14)]),
      player('p1', 'Est', []),
      player('p2', 'Nord', []),
      player('p3', 'Ouest', []),
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
    expect(engine.message.value).toContain('Main terminée')
  })
})
