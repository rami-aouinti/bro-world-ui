import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  emits: ['click'],
  props: {
    disabled: { type: Boolean, required: false },
  },
  setup(props, { slots, emit }) {
    return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
  },
})

const PanelLayoutStub = defineComponent({
  name: 'PlatformSplitLayout',
  setup(_, { slots }) {
    return () => h('div', [slots.default?.(), slots.aside?.()])
  },
})

const PassiveStub = defineComponent({
  name: 'PassiveStub',
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const UnoGameStub = defineComponent({
  name: 'UnoGame',
  setup() {
    return () => h('div', { class: 'uno-game-stub' }, 'UnoGame Stub')
  },
})

vi.mock('~/components/games/BeloteGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/CheckersGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/ChessGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/RamiGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/PokerGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/NonogramGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/HiddenWordGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/SudokuGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/Game2048.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/UnoGame.vue', () => ({ default: UnoGameStub }))
vi.mock('~/components/games/GameMatchAside.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/platform/PlatformSplitLayout.vue', () => ({ default: PanelLayoutStub }))

const mountPage = async () => {
  const Component = (await import('~/app/pages/game/index.vue')).default
  return mount(Component, {
    global: {
      stubs: {
        PlatformSplitLayout: PanelLayoutStub,
        GameMatchAside: PassiveStub,
        RamiGame: PassiveStub,
        BeloteGame: PassiveStub,
        CheckersGame: PassiveStub,
        PokerGame: PassiveStub,
        NonogramGame: PassiveStub,
        HiddenWordGame: PassiveStub,
        ChessGame: PassiveStub,
        SudokuGame: PassiveStub,
        Game2048: PassiveStub,
        UnoGame: UnoGameStub,
        'v-btn': makeStub('v-btn'),
        'v-card': makeStub('v-card'),
        'v-card-text': PassiveStub,
        'v-row': PassiveStub,
        'v-col': PassiveStub,
        'v-avatar': PassiveStub,
        'v-icon': PassiveStub,
        'v-alert': PassiveStub,
        'v-dialog': PassiveStub,
        'v-text-field': PassiveStub,
        'v-snackbar': PassiveStub,
        'v-chip': PassiveStub,
        'v-divider': PassiveStub,
      },
    },
  })
}

describe('game page UNO integration', () => {
  beforeEach(() => {
    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key })))
    vi.stubGlobal('useAuth', vi.fn(() => ({ isAuthenticated: { value: true }, login: vi.fn() })))
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ profile: { username: 'tester' } })))
  })

  it('contient UNO dans le catalogue cartes et lance UnoGame', async () => {
    const wrapper = await mountPage()
    const vm = wrapper.vm as unknown as {
      openCategory: (id: string) => void
      openSubCategory: (id: string) => void
      openGame: (id: string) => void
      selectPlayMode: (mode: 'ai' | 'pvp') => void
      launchGame: () => void
    }

    vm.openCategory('cards')
    vm.openSubCategory('classic-cards')
    await nextTick()

    expect(wrapper.text()).toContain('gamePage.catalog.games.uno.name')

    vm.openGame('uno')
    vm.selectPlayMode('ai')
    vm.launchGame()
    await nextTick()

    expect(wrapper.find('.uno-game-stub').exists()).toBe(true)
  })
})
