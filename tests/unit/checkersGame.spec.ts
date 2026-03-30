import { defineComponent, h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const boardState = (wrapper: VueWrapper) => wrapper.findAll('button.checkers-cell').map((cell) => {
  if (cell.find('.piece--red').exists()) {
    return 'red'
  }

  if (cell.find('.piece--black').exists()) {
    return 'black'
  }

  return 'empty'
})

const clickCell = async (wrapper: VueWrapper, row: number, col: number) => {
  const cell = wrapper.findAll('button.checkers-cell')[row * 8 + col]
  await cell.trigger('click')
}

const createEmptyBoard = () => Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))

const mountGame = async (selectedPlayMode: 'ai' | 'pvp') => {
  const Component = (await import('~/app/components/games/CheckersGame.vue')).default

  return mount(Component, {
    props: { selectedPlayMode },
    global: {
      stubs: {
        'v-card': makeStub('v-card'),
        'v-btn': makeStub('v-btn'),
        'v-icon': makeStub('v-icon'),
      },
    },
  })
}

describe('CheckersGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key })))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('mode IA: ignore les clics utilisateur pendant le tour black', async () => {
    const wrapper = await mountGame('ai')

    await clickCell(wrapper, 5, 0)
    await clickCell(wrapper, 4, 1)
    await nextTick()

    expect(wrapper.text()).toContain('Joueur actif: black')

    const beforeBlackClick = boardState(wrapper)
    await clickCell(wrapper, 2, 1)
    await clickCell(wrapper, 3, 0)

    expect(boardState(wrapper)).toEqual(beforeBlackClick)
  })

  it('auto move IA: joue automatiquement après passage du tour à black', async () => {
    const wrapper = await mountGame('ai')

    await clickCell(wrapper, 5, 0)
    await clickCell(wrapper, 4, 1)
    await nextTick()

    const beforeAiMove = boardState(wrapper)
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(boardState(wrapper)).not.toEqual(beforeAiMove)
    expect(wrapper.text()).toContain('Joueur actif: red')
  })

  it('timeout: exécute un coup auto lorsque le timer atteint 0', async () => {
    const wrapper = await mountGame('pvp')
    const beforeTimeoutMove = boardState(wrapper)

    await vi.advanceTimersByTimeAsync(60_000)
    await nextTick()

    expect(boardState(wrapper)).not.toEqual(beforeTimeoutMove)
    expect(wrapper.text()).toContain('Joueur actif: black')
    expect(wrapper.text()).toContain('Temps restant: 60s')
  })

  it('mode pvp inchangé: les deux joueurs restent manuels', async () => {
    const wrapper = await mountGame('pvp')

    await clickCell(wrapper, 5, 0)
    await clickCell(wrapper, 4, 1)
    await nextTick()
    expect(wrapper.text()).toContain('Joueur actif: black')

    const beforeBlackMove = boardState(wrapper)
    await clickCell(wrapper, 2, 1)
    await clickCell(wrapper, 3, 0)
    await nextTick()

    expect(boardState(wrapper)).not.toEqual(beforeBlackMove)
    expect(wrapper.text()).toContain('Joueur actif: red')
  })

  it('n redémarre pas le timer après une victoire', async () => {
    const wrapper = await mountGame('pvp')

    const customBoard = createEmptyBoard()
    customBoard[2][1] = { player: 'red', king: false }
    customBoard[1][2] = { player: 'black', king: false }

    wrapper.vm.board = customBoard
    wrapper.vm.currentPlayer = 'red'
    wrapper.vm.message = 'Joueur actif: red'
    wrapper.vm.selected = null
    await nextTick()

    await clickCell(wrapper, 2, 1)
    await clickCell(wrapper, 0, 3)
    await nextTick()

    const boardAfterWin = boardState(wrapper)
    expect(wrapper.text()).toContain('gameComponents.checkers.players.redWin')

    await vi.advanceTimersByTimeAsync(120_000)
    await nextTick()

    expect(boardState(wrapper)).toEqual(boardAfterWin)
    expect(wrapper.text()).toContain('gameComponents.checkers.players.redWin')
    expect(wrapper.text()).toContain('Temps restant: 60s')
  })

  it('autorise une capture multiple sur un même tour', async () => {
    const wrapper = await mountGame('pvp')

    const customBoard = createEmptyBoard()
    customBoard[5][0] = { player: 'red', king: false }
    customBoard[5][2] = { player: 'red', king: false }
    customBoard[4][1] = { player: 'black', king: false }
    customBoard[2][3] = { player: 'black', king: false }
    customBoard[7][6] = { player: 'black', king: false }

    wrapper.vm.board = customBoard
    wrapper.vm.currentPlayer = 'red'
    wrapper.vm.selected = null
    await nextTick()

    await clickCell(wrapper, 5, 0)
    await clickCell(wrapper, 3, 2)
    await nextTick()

    expect(wrapper.vm.currentPlayer).toBe('red')
    expect(wrapper.vm.selected).toEqual({ row: 3, col: 2 })
    expect(wrapper.vm.board[4][1]).toBeNull()

    await clickCell(wrapper, 5, 2)
    await clickCell(wrapper, 4, 3)
    await nextTick()

    expect(wrapper.vm.board[5][2]).toEqual({ player: 'red', king: false })
    expect(wrapper.vm.currentPlayer).toBe('red')

    await clickCell(wrapper, 1, 4)
    await nextTick()

    expect(wrapper.vm.board[1][4]).toEqual({ player: 'red', king: false })
    expect(wrapper.vm.board[2][3]).toBeNull()
    expect(wrapper.vm.currentPlayer).toBe('black')
    expect(wrapper.vm.selected).toBeNull()
  })

  it('permet une capture supplémentaire après promotion en king', async () => {
    const wrapper = await mountGame('pvp')

    const customBoard = createEmptyBoard()
    customBoard[2][1] = { player: 'red', king: false }
    customBoard[1][2] = { player: 'black', king: false }
    customBoard[2][5] = { player: 'black', king: false }
    customBoard[7][0] = { player: 'black', king: false }

    wrapper.vm.board = customBoard
    wrapper.vm.currentPlayer = 'red'
    wrapper.vm.selected = null
    await nextTick()

    await clickCell(wrapper, 2, 1)
    await clickCell(wrapper, 0, 3)
    await nextTick()

    expect(wrapper.vm.board[0][3]).toEqual({ player: 'red', king: true })
    expect(wrapper.vm.currentPlayer).toBe('red')
    expect(wrapper.vm.selected).toEqual({ row: 0, col: 3 })

    await clickCell(wrapper, 4, 7)
    await nextTick()

    expect(wrapper.vm.board[4][7]).toEqual({ player: 'red', king: true })
    expect(wrapper.vm.board[2][5]).toBeNull()
    expect(wrapper.vm.currentPlayer).toBe('black')
  })

  it('interdit de terminer le tour sans capture suivante quand elle existe', async () => {
    const wrapper = await mountGame('pvp')

    const customBoard = createEmptyBoard()
    customBoard[5][0] = { player: 'red', king: false }
    customBoard[4][1] = { player: 'black', king: false }
    customBoard[2][3] = { player: 'black', king: false }

    wrapper.vm.board = customBoard
    wrapper.vm.currentPlayer = 'red'
    wrapper.vm.selected = null
    await nextTick()

    await clickCell(wrapper, 5, 0)
    await clickCell(wrapper, 3, 2)
    await nextTick()

    const boardAfterFirstCapture = JSON.parse(JSON.stringify(wrapper.vm.board))

    await clickCell(wrapper, 2, 1)
    await nextTick()

    expect(wrapper.vm.board).toEqual(boardAfterFirstCapture)
    expect(wrapper.vm.currentPlayer).toBe('red')
    expect(wrapper.vm.selected).toEqual({ row: 3, col: 2 })
  })
})
