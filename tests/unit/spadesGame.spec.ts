import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const createEngineMock = () => ({
  players: ref([
    { id: 's0', name: 'Vous', isAI: false, hand: [], bid: 2, tricksWon: 2, score: 40 },
    { id: 's1', name: 'IA', isAI: true, hand: [], bid: 2, tricksWon: 1, score: 20 },
  ]),
  trick: ref([]),
  turnIndex: ref(0),
  handNumber: ref(1),
  spadesBroken: ref(false),
  message: ref('ready'),
  isHandOver: ref(false),
  canPlayCard: vi.fn(() => true),
  applyMove: vi.fn(() => true),
  chooseAiMove: vi.fn(() => null),
  draw: vi.fn(() => false),
  nextAiTurn: vi.fn(() => false),
  undo: vi.fn(),
  startNewHand: vi.fn(),
  getValidMoves: vi.fn(() => []),
})

let engineMock = createEngineMock()

vi.mock('~/app/composables/games/engines/useSpadesEngine', () => ({
  useSpadesEngine: () => engineMock,
}))

const mountGame = async () => {
  const Component = (await import('~/app/components/games/SpadesGame.vue')).default

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

describe('SpadesGame', () => {
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
      title: 'Spades',
      kpis: [
        expect.objectContaining({ id: 'spades-hand' }),
        expect.objectContaining({ id: 'spades-score' }),
      ],
    })
  })

  it('émet finished quand la main est terminée', async () => {
    const wrapper = await mountGame()

    engineMock.isHandOver.value = true
    await nextTick()

    expect(wrapper.emitted('finished')?.at(0)?.[0]).toEqual({ result: 'win' })
  })
})
