import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UnoCard, UnoColor } from '~/app/composables/games/useUnoEngine'

const makeStub = (name: string) => defineComponent({
  name,
  emits: ['click', 'update:modelValue'],
  props: {
    modelValue: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
  },
  setup(props, { slots, emit }) {
    return () => h(
      'button',
      {
        disabled: props.disabled,
        onClick: () => emit('click'),
      },
      slots.default?.(),
    )
  },
})

const DialogStub = defineComponent({
  name: 'v-dialog',
  props: {
    modelValue: { type: Boolean, required: true },
  },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'dialog-stub' }, slots.default?.()) : null)
  },
})

const CardTableLayoutStub = defineComponent({
  name: 'CardTableLayout',
  setup(_, { slots }) {
    return () => h('div', [
      slots.center?.(),
      slots['seat-south-hand']?.(),
      slots['seat-north-hand']?.(),
      slots['seat-east-hand']?.(),
      slots['seat-west-hand']?.(),
    ])
  },
})

const card = (id: string, color: UnoColor | null, value: UnoCard['value']): UnoCard => ({ id, color, value })

const createEngineMock = () => {
  const players = ref([
    { id: 'p0', name: 'Vous', isAI: false, hand: [card('local-1', 'red', '5')], score: 0, hasCalledUno: false },
    { id: 'p1', name: 'IA 2', isAI: true, hand: [card('ai-1', 'blue', '3')], score: 0, hasCalledUno: false },
    { id: 'p2', name: 'IA 3', isAI: true, hand: [], score: 0, hasCalledUno: false },
    { id: 'p3', name: 'IA 4', isAI: true, hand: [], score: 0, hasCalledUno: false },
  ])

  const roundState = ref({
    drawPileCount: 20,
    discardPileTop: card('top', 'red', '1'),
    currentColor: 'red' as UnoColor,
    direction: 1 as 1 | -1,
    currentPlayerIndex: 0,
    pendingDrawCount: 0,
    winnerIndex: null as number | null,
    turnNumber: 1,
  })

  const playableCards = computed(() => players.value[0]?.hand ?? [])
  const message = ref('Manche UNO prête')
  const currentRound = ref(1)
  const roundWinnerIndex = ref<number | null>(null)
  const gameWinnerIndex = ref<number | null>(null)
  const scoreTarget = 500

  const getValidMoves = vi.fn((index: number) => {
    if (index === 1) {
      return [{ type: 'play', cardId: 'ai-1' }]
    }
    return [{ type: 'play', cardId: 'local-1' }, { type: 'draw' }]
  })

  return {
    players,
    roundState,
    playableCards,
    message,
    currentRound,
    roundWinnerIndex,
    gameWinnerIndex,
    scoreTarget,
    getValidMoves,
    playCard: vi.fn(() => true),
    drawCard: vi.fn(() => card('drawn', 'yellow', '6')),
    chooseColor: vi.fn(() => true),
    callUno: vi.fn(() => true),
    startRound: vi.fn(),
    startNextRound: vi.fn(() => true),
  }
}

let engineMock = createEngineMock()

vi.mock('~/app/composables/games/useUnoEngine', () => ({
  useUnoEngine: () => engineMock,
}))

const mountGame = async () => {
  const Component = (await import('~/app/components/games/UnoGame.vue')).default

  return mount(Component, {
    props: { selectedPlayMode: 'ai' },
    global: {
      stubs: {
        CardTableLayout: CardTableLayoutStub,
        'v-card': makeStub('v-card'),
        'v-btn': makeStub('v-btn'),
        'v-chip': makeStub('v-chip'),
        'v-dialog': DialogStub,
        'v-switch': makeStub('v-switch'),
        TransitionGroup: defineComponent({ name: 'TransitionGroup', setup(_, { slots }) { return () => h('div', slots.default?.()) } }),
      },
    },
  })
}

describe('UnoGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    engineMock = createEngineMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('affiche le rendu principal', async () => {
    const wrapper = await mountGame()

    expect(wrapper.text()).toContain('UNO · AI')
    expect(wrapper.text()).toContain('Pioche: 20')
    expect(wrapper.text()).toContain('Tour:')
  })

  it('émet panel-state', async () => {
    const wrapper = await mountGame()
    await nextTick()

    const payload = wrapper.emitted('panel-state')?.at(0)?.[0]
    expect(payload).toMatchObject({
      gameKey: 'uno',
      title: 'UNO',
      turnLabel: 'Vous',
    })
  })

  it('enchaîne un tour IA quand le joueur courant est une IA', async () => {
    await mountGame()

    engineMock.roundState.value.currentPlayerIndex = 1
    await nextTick()
    await vi.advanceTimersByTimeAsync(700)

    expect(engineMock.playCard).toHaveBeenCalledWith(1, 'ai-1')
  })

  it('ouvre la sélection couleur pour une Wild et choisit une couleur', async () => {
    engineMock.players.value[0]!.hand = [card('wild-local', null, 'wild')]
    engineMock.getValidMoves.mockImplementation(() => [{ type: 'play', cardId: 'wild-local' }])

    const wrapper = await mountGame()

    await wrapper.find('.uno-local-hand__cards button').trigger('click')
    await nextTick()

    const colorButtons = wrapper.findAll('.uno-color-button')
    expect(colorButtons.length).toBeGreaterThan(0)

    await colorButtons[0]!.trigger('click')

    expect(engineMock.playCard).toHaveBeenCalledWith(0, 'wild-local')
    expect(engineMock.chooseColor).toHaveBeenCalledWith('red')
  })
})
