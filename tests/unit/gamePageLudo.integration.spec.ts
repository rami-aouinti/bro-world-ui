import { defineComponent, h, nextTick, ref } from 'vue'
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

const LudoGameStub = defineComponent({
  name: 'LudoGame',
  setup() {
    return () => h('div', { class: 'ludo-game-stub' }, 'LudoGame Stub')
  },
})

const GameConceptPreviewStub = defineComponent({
  name: 'GameConceptPreview',
  setup() {
    return () => h('div', { class: 'game-concept-preview-stub' }, 'Game Concept Preview Stub')
  },
})

vi.mock('~/components/games/BeloteGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/CheckersGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/ChessGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/RamiGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/PokerGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/SolitaireGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/HeartsGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/SpadesGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/NonogramGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/HiddenWordGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/SudokuGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/Game2048.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/UnoGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/LudoGame.vue', () => ({ default: LudoGameStub }))
vi.mock('~/components/games/FlappyRocketGame.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/GameConceptPreview.vue', () => ({ default: GameConceptPreviewStub }))
vi.mock('~/components/games/lobby/GameQuickAccessPanel.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/lobby/GameModeSelectionPanel.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/games/lobby/GameDetailsPanel.vue', () => ({ default: PassiveStub }))
vi.mock('~/components/platform/PlatformSplitLayout.vue', () => ({ default: PanelLayoutStub }))


vi.mock('~/stores/gameCatalog', () => ({
  useGameCatalogStore: () => ({
    categories: ref([
      {
        id: 'arcade',
        subCategories: [
          {
            id: 'cards',
            games: [
              {
                id: 'ludo',
                key: 'ludo',
                nameKey: 'gameCatalog.games.ludo.name',
                component: 'ludo',
                supportedModes: ['pvp'],
                developmentStatus: 'coming_soon',
              },
            ],
          },
        ],
      },
    ]),
    isLoading: ref(false),
    error: ref(null),
    fetchCatalog: vi.fn(async () => {}),
  }),
}))
vi.mock('~/stores/games', () => ({
  useGamesStore: () => ({
    featuredGames: ref([]),
    isLoading: ref(false),
    fetchGames: vi.fn(async () => {}),
  }),
}))

vi.mock('~/composables/api/useGameSessionsApi', () => ({
  useGameSessionsApi: () => ({
    startGameSession: vi.fn(),
  }),
}))


const mountPage = async () => {
  const Component = (await import('~/app/pages/game/index.vue')).default
  return mount(Component, {
    global: {
      stubs: {
        PlatformSplitLayout: PanelLayoutStub,
        GameQuickAccessPanel: PassiveStub,
        GameModeSelectionPanel: PassiveStub,
        GameDetailsPanel: PassiveStub,
        GameConceptPreview: GameConceptPreviewStub,
        RamiGame: PassiveStub,
        BeloteGame: PassiveStub,
        CheckersGame: PassiveStub,
        PokerGame: PassiveStub,
        SolitaireGame: PassiveStub,
        HeartsGame: PassiveStub,
        SpadesGame: PassiveStub,
        NonogramGame: PassiveStub,
        HiddenWordGame: PassiveStub,
        ChessGame: PassiveStub,
        SudokuGame: PassiveStub,
        Game2048: PassiveStub,
        UnoGame: PassiveStub,
        LudoGame: LudoGameStub,
        FlappyRocketGame: PassiveStub,
        'v-btn': makeStub('v-btn'),
        'v-card': makeStub('v-card'),
        'v-card-text': PassiveStub,
        'v-card-subtitle': PassiveStub,
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
        'v-progress-circular': PassiveStub,
        'v-img': PassiveStub,
      },
    },
  })
}

describe('game page Ludo integration', () => {
  beforeEach(() => {
    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key, te: () => true })))
    vi.stubGlobal('useAuth', vi.fn(() => ({ isAuthenticated: { value: true }, login: vi.fn() })))
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ profile: { username: 'tester', coins: 0 } })))
    vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn() })))
    vi.stubGlobal('useTracker', vi.fn(() => ({ track: vi.fn() })))
  })

  it('affiche Ludo dans le catalogue et garde le fallback concept si coming_soon', async () => {
    const wrapper = await mountPage()
    const vm = wrapper.vm as unknown as {
      openCategory: (id: string) => void
      openSubCategory: (id: string) => void
      openGame: (id: string) => void
      launchGame: () => void
      selectedGameId: string | null
    }

    vm.openCategory('arcade')
    vm.openSubCategory('cards')
    await nextTick()

    expect(wrapper.text()).toContain('gameCatalog.games.ludo.name')

    vm.openGame('ludo')
    await nextTick()

    expect(vm.selectedGameId).toBe('ludo')
    expect(wrapper.find('.game-concept-preview-stub').exists()).toBe(true)

    vm.launchGame()
    await nextTick()

    expect(wrapper.find('.ludo-game-stub').exists()).toBe(false)
  })

  it('openGame("ludo") + launchGame() rend LudoGame quand le statut est playable', async () => {
    const wrapper = await mountPage()
    const vm = wrapper.vm as unknown as {
      openCategory: (id: string) => void
      openSubCategory: (id: string) => void
      openGame: (id: string) => void
      launchGame: () => void
      selectedGame: { developmentStatus: string } | null
      selectedGameId: string | null
      selectedPlayMode: 'ai' | 'pvp' | null
    }

    vm.openCategory('arcade')
    vm.openSubCategory('cards')
    vm.openGame('ludo')
    await nextTick()

    expect(vm.selectedGameId).toBe('ludo')

    if (vm.selectedGame) {
      vm.selectedGame.developmentStatus = 'playable'
    }
    vm.selectedPlayMode = 'pvp'
    vm.launchGame()
    await nextTick()

    expect(wrapper.find('.ludo-game-stub').exists()).toBe(true)
  })
})
