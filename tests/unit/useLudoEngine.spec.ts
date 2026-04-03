import { describe, expect, it } from 'vitest'
import { useLudoEngine } from '~/app/composables/games/useLudoEngine'

describe('useLudoEngine', () => {
  it('autorise la sortie de base uniquement avec un 6', () => {
    const engine = useLudoEngine({ playerCount: 2 })
    const pawnId = engine.players.value[0]!.pawns[0]!.id

    engine.rollDice(5)
    expect(engine.selectPawn(pawnId)).toBe(false)
    expect(engine.applyMove(pawnId)).toBe(false)

    expect(engine.endTurn()).toBe(true)
    expect(engine.currentPlayerIndex.value).toBe(1)

    engine.currentPlayerIndex.value = 0
    engine.rollDice(6)
    expect(engine.selectPawn(pawnId)).toBe(true)
    expect(engine.applyMove()).toBe(true)

    const movedPawn = engine.players.value[0]!.pawns[0]!
    expect(engine.getPawnPosition(movedPawn, 0).zone).toBe('track')
    expect(engine.getPawnPosition(movedPawn, 0).trackIndex).toBe(0)
  })

  it('gère les mouvements valides et invalides sur la piste/home', () => {
    const engine = useLudoEngine({ playerCount: 2 })
    const pawn = engine.players.value[0]!.pawns[0]!

    pawn.progress = 55
    engine.rollDice(3)
    expect(engine.applyMove(pawn.id)).toBe(false)

    expect(engine.endTurn()).toBe(true)
    engine.currentPlayerIndex.value = 0

    engine.rollDice(2)
    expect(engine.applyMove(pawn.id)).toBe(true)

    const position = engine.getPawnPosition(pawn, 0)
    expect(position.zone).toBe('home')
    expect(position.homeIndex).toBe(5)
    expect(position.isFinished).toBe(true)
  })

  it('capture un pion adverse sur une case non safe', () => {
    const engine = useLudoEngine({ playerCount: 2 })
    const attacker = engine.players.value[0]!.pawns[0]!
    const target = engine.players.value[1]!.pawns[0]!

    attacker.progress = 1 // Track absolute index = 1
    target.progress = 41 // Player 2 start offset 13 => absolute index = 2

    engine.rollDice(1)
    expect(engine.applyMove(attacker.id)).toBe(true)

    expect(target.progress).toBe(-1)
    expect(engine.moveHistory.value.at(-1)?.capturedPawnIds).toContain(target.id)
  })

  it('passe au joueur suivant après un tour sans 6', () => {
    const engine = useLudoEngine({ playerCount: 3 })

    engine.rollDice(1)
    expect(engine.endTurn()).toBe(true)
    expect(engine.currentPlayerIndex.value).toBe(1)

    engine.rollDice(6)
    expect(engine.applyMove(engine.players.value[1]!.pawns[0]!.id)).toBe(true)
    expect(engine.endTurn()).toBe(true)
    expect(engine.currentPlayerIndex.value).toBe(1)
  })

  it('déclare le gagnant quand 4 pions sont rentrés', () => {
    const engine = useLudoEngine({ playerCount: 2 })
    const player = engine.players.value[0]!

    player.pawns.forEach((pawn, pawnIndex) => {
      pawn.progress = pawnIndex === 0 ? 56 : 57
    })

    engine.rollDice(1)
    expect(engine.applyMove(player.pawns[0]!.id)).toBe(true)
    expect(engine.winnerIndex.value).toBe(0)

    expect(engine.endTurn()).toBe(false)
  })
})
