import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const createEngineMock = () => ({
  waste: ref([]),
  stock: ref(Array.from({ length: 24 }, (_, idx) => ({ id: `s-${idx}` }))),
  foundations: ref([[], [], [], []]),
  tableau: ref([[], [], [], [], [], [], []]),
  moveCount: ref(0),
  score: computed(() => 0),
  message: ref('ready'),
  isWon: ref(false),
  suggestBestMove: vi.fn(() => null),
  applyMove: vi.fn(() => true),
  startNewGame: vi.fn(),
  undo: vi.fn(),
  draw: vi.fn(),
  autoCompleteFoundations: vi.fn(),
})

let engineMock = createEngineMock()

vi.mock('~/app/composables/games/engines/useSolitaireEngine', () => ({
  useSolitaireEngine: () => engineMock,
}))

const mountGame = async () => {
  const Component = (await import('~/app/components/games/SolitaireGame.vue')).default

  return mount(Component, {
    props: { selectedPlayMode: 'ai' },
    global: {
      stubs: {
        'v-card': makeStub('v-card'),
        'v-card-title': makeStub('v-card-title'),
        'v-card-text': makeStub('v-card-text'),
        'v-chip': makeStub('v-chip'),
        'v-btn': makeStub('v-btn'),
      },
    },
  })
}

describe('SolitaireGame', () => {
  beforeEach(() => {
    engineMock = createEngineMock()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('émet panel-state', async () => {
    const wrapper = await mountGame()
    await nextTick()

    const payload = wrapper.emitted('panel-state')?.at(0)?.[0]
    expect(payload).toMatchObject({
      title: 'Solitaire',
      kpis: [
        expect.objectContaining({ id: 'solitaire-moves' }),
        expect.objectContaining({ id: 'solitaire-score' }),
      ],
    })
  })

  it('émet finished quand la partie est gagnée', async () => {
    const wrapper = await mountGame()

    engineMock.isWon.value = true
    await nextTick()

    expect(wrapper.emitted('finished')?.at(0)?.[0]).toEqual({ result: 'win' })
  })
})
