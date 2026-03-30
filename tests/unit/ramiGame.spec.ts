import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const CardTableLayoutStub = defineComponent({
  name: 'CardTableLayout',
  props: {
    turnTimerSeconds: {
      type: Number,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-turn-timer-seconds': props.turnTimerSeconds }, slots.default?.())
  },
})

const mountGame = async () => {
  const Component = (await import('~/app/components/games/RamiGame.vue')).default

  return mount(Component, {
    props: { selectedPlayMode: 'pvp' },
    global: {
      stubs: {
        'v-chip': makeStub('v-chip'),
        'v-btn': makeStub('v-btn'),
        CardTableLayout: CardTableLayoutStub,
      },
    },
  })
}

describe('RamiGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key })))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('timeout: bascule automatiquement après 120s', async () => {
    const wrapper = await mountGame()

    expect(wrapper.text()).toContain('120s / 120s')
    expect(wrapper.text()).toContain('Tour: Vous')

    await vi.advanceTimersByTimeAsync(119_000)
    await nextTick()

    expect(wrapper.text()).toContain('1s / 120s')

    await vi.advanceTimersByTimeAsync(1_000)
    await nextTick()

    expect(wrapper.text()).toContain('Tour: Ordinateur')
    expect(wrapper.text()).toContain('120s / 120s')

    expect(wrapper.find('[data-turn-timer-seconds="120"]').exists()).toBe(true)
  })
})
