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
  players: ref([
    { id: 'h0', name: 'Vous', isAI: false, hand: [], score: 10, tricksWon: 0 },
    { id: 'h1', name: 'IA', isAI: true, hand: [], score: 18, tricksWon: 0 },
  ]),
  trick: ref([]),
  turnIndex: ref(0),
  heartsBroken: ref(false),
  handNumber: ref(1),
  message: ref('ready'),
  isHandOver: ref(false),
  canPlayCard: vi.fn(() => true),
  applyMove: vi.fn(() => true),
  nextAiTurn: vi.fn(() => false),
  startNewHand: vi.fn(),
  undo: vi.fn(),
  getValidMoves: vi.fn(() => []),
  draw: vi.fn(() => false),
  chooseAiMove: vi.fn(() => null),
})

let engineMock = createEngineMock()

vi.mock('~/app/composables/games/engines/useHeartsEngine', () => ({
  useHeartsEngine: () => engineMock,
}))

const mountGame = async () => {
  const Component = (await import('~/app/components/games/HeartsGame.vue')).default

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

describe('HeartsGame', () => {
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
      title: 'Hearts',
      kpis: [
        expect.objectContaining({ id: 'hearts-hand' }),
        expect.objectContaining({ id: 'hearts-score' }),
      ],
    })
  })

  it('émet finished en victoire si le joueur a le meilleur score', async () => {
    const wrapper = await mountGame()

    engineMock.isHandOver.value = true
    await nextTick()

    expect(wrapper.emitted('finished')?.at(0)?.[0]).toEqual({ result: 'win' })
  })
})
