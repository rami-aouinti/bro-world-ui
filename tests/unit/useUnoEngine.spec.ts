import { describe, expect, it } from 'vitest'
import { useUnoEngine, type UnoCard } from '~/app/composables/games/useUnoEngine'

const card = (id: string, color: UnoCard['color'], value: UnoCard['value']): UnoCard => ({ id, color, value })

describe('useUnoEngine', () => {
  it('valide les coups légaux et rejette les coups illégaux', () => {
    const engine = useUnoEngine({ playerCount: 2, includeHumanPlayer: true })

    engine.players.value[0]!.hand = [
      card('legal', 'red', '5'),
      card('illegal', 'blue', '7'),
    ]
    engine.players.value[1]!.hand = [card('p2', 'yellow', '1')]
    engine.discardPile.value = [card('top', 'red', '1')]
    engine.currentColor.value = 'red'
    engine.currentPlayerIndex.value = 0

    expect(engine.playCard(0, 'legal')).toBe(true)
    expect(engine.discardPile.value.at(-1)?.id).toBe('legal')

    engine.currentPlayerIndex.value = 0
    expect(engine.playCard(0, 'illegal')).toBe(false)
    expect(engine.players.value[0]?.hand.some(c => c.id === 'illegal')).toBe(true)
    expect(engine.discardPile.value.at(-1)?.id).toBe('legal')
  })

  it('applique les effets Skip/Reverse/Draw2/Wild/Wild+4', () => {
    const engine = useUnoEngine({ playerCount: 3, includeHumanPlayer: false })

    // Skip
    engine.players.value[0]!.hand = [card('skip', 'red', 'skip'), card('keep0', 'yellow', '1')]
    engine.players.value[1]!.hand = [card('p1', 'yellow', '1')]
    engine.players.value[2]!.hand = [card('p2', 'green', '2')]
    engine.discardPile.value = [card('top', 'red', '9')]
    engine.currentColor.value = 'red'
    engine.currentPlayerIndex.value = 0
    expect(engine.playCard(0, 'skip')).toBe(true)
    expect(engine.currentPlayerIndex.value).toBe(2)

    // Reverse (3 joueurs)
    engine.startRound()
    engine.players.value[0]!.hand = [card('reverse', 'yellow', 'reverse'), card('keep1', 'green', '4')]
    engine.players.value[1]!.hand = [card('p1', 'yellow', '1')]
    engine.players.value[2]!.hand = [card('p2', 'green', '2')]
    engine.discardPile.value = [card('top2', 'yellow', '9')]
    engine.currentColor.value = 'yellow'
    engine.currentPlayerIndex.value = 0
    expect(engine.playCard(0, 'reverse')).toBe(true)
    expect(engine.roundState.value.direction).toBe(-1)
    expect(engine.currentPlayerIndex.value).toBe(2)

    // Draw 2
    engine.startRound()
    engine.players.value[0]!.hand = [card('draw2', 'blue', 'draw-two'), card('keep2', 'red', '8')]
    engine.players.value[1]!.hand = [card('a', 'red', '1')]
    engine.players.value[2]!.hand = [card('b', 'green', '2')]
    engine.discardPile.value = [card('top3', 'blue', '5')]
    engine.currentColor.value = 'blue'
    engine.currentPlayerIndex.value = 0
    const beforeDrawTwo = engine.players.value[1]!.hand.length
    expect(engine.playCard(0, 'draw2')).toBe(true)
    expect(engine.players.value[1]!.hand.length).toBe(beforeDrawTwo + 2)
    expect(engine.currentPlayerIndex.value).toBe(2)

    // Wild
    engine.startRound()
    engine.players.value[0]!.hand = [card('wild', null, 'wild'), card('keep3', 'green', '8')]
    engine.players.value[1]!.hand = [card('p1x', 'red', '1')]
    engine.players.value[2]!.hand = [card('p2x', 'green', '2')]
    engine.discardPile.value = [card('top4', 'green', '7')]
    engine.currentColor.value = 'green'
    engine.currentPlayerIndex.value = 0
    expect(engine.playCard(0, 'wild')).toBe(true)
    expect(engine.getValidMoves(0)).toEqual([
      { type: 'choose-color', color: 'red' },
      { type: 'choose-color', color: 'yellow' },
      { type: 'choose-color', color: 'green' },
      { type: 'choose-color', color: 'blue' },
    ])
    expect(engine.chooseColor('blue')).toBe(true)
    expect(engine.currentColor.value).toBe('blue')

    // Wild +4
    engine.startRound()
    engine.players.value[0]!.hand = [card('wild4', null, 'wild-draw-four'), card('keep4', 'blue', '9')]
    engine.players.value[1]!.hand = [card('x', 'red', '1')]
    engine.players.value[2]!.hand = [card('y', 'green', '2')]
    engine.discardPile.value = [card('top5', 'yellow', '4')]
    engine.currentColor.value = 'yellow'
    engine.currentPlayerIndex.value = 0
    const beforeWildDrawFour = engine.players.value[1]!.hand.length
    expect(engine.playCard(0, 'wild4')).toBe(true)
    expect(engine.chooseColor('red')).toBe(true)
    expect(engine.players.value[1]!.hand.length).toBe(beforeWildDrawFour + 4)
    expect(engine.currentPlayerIndex.value).toBe(2)
  })

  it('applique la pénalité UNO si non annoncé', () => {
    const engine = useUnoEngine({ playerCount: 2, includeHumanPlayer: true })

    engine.players.value[0]!.hand = [
      card('to-play', 'red', '3'),
      card('last', 'blue', '4'),
    ]
    engine.players.value[1]!.hand = [card('p2', 'yellow', '1')]
    engine.discardPile.value = [card('top', 'red', '9')]
    engine.currentColor.value = 'red'
    engine.currentPlayerIndex.value = 0

    expect(engine.playCard(0, 'to-play')).toBe(true)
    expect(engine.players.value[0]!.hand.length).toBe(3)
    expect(engine.message.value).toContain('oublié UNO')
  })

  it('termine la manche et calcule le score', () => {
    const engine = useUnoEngine({ playerCount: 2, includeHumanPlayer: true, scoreTarget: 50 })

    engine.players.value[0]!.score = 0
    engine.players.value[1]!.score = 0
    engine.players.value[0]!.hand = [card('final', 'red', '9')]
    engine.players.value[1]!.hand = [
      card('n1', 'blue', '5'),
      card('a1', 'blue', 'skip'),
      card('w1', null, 'wild'),
    ]
    engine.discardPile.value = [card('top', 'red', '1')]
    engine.currentColor.value = 'red'
    engine.currentPlayerIndex.value = 0

    expect(engine.playCard(0, 'final')).toBe(true)
    expect(engine.roundWinnerIndex.value).toBe(0)
    expect(engine.players.value[0]!.score).toBe(75)
    expect(engine.gameWinnerIndex.value).toBe(0)
  })
})
