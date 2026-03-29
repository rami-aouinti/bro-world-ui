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
})
