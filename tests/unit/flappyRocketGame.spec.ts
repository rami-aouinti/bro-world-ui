import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type RafCallback = (ts: number) => void

const makeStub = (name: string) => defineComponent({
  name,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const createRafController = () => {
  let seq = 0
  const callbacks = new Map<number, RafCallback>()

  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: RafCallback) => {
    seq += 1
    callbacks.set(seq, cb)
    return seq
  }))

  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
    callbacks.delete(id)
  }))

  return {
    runFrame(ts: number) {
      const entries = [...callbacks.entries()]
      callbacks.clear()
      for (const [, cb] of entries) {
        cb(ts)
      }
    },
  }
}

const mountGame = async () => {
  const Component = (await import('~/app/components/games/FlappyRocketGame.vue')).default

  return mount(Component, {
    props: { selectedPlayMode: 'ai' },
    global: {
      stubs: {
        'v-chip': makeStub('v-chip'),
        'v-btn': makeStub('v-btn'),
      },
    },
  })
}

describe('FlappyRocketGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('affiche le rendu initial', async () => {
    const wrapper = await mountGame()

    expect(wrapper.text()).toContain('Flappy Rocket')
    expect(wrapper.text()).toContain('Score: 0')
    expect(wrapper.text()).toContain('Record: 0')
    expect(wrapper.text()).toContain('Start')
  })

  it('démarre au clic', async () => {
    createRafController()
    const wrapper = await mountGame()

    await wrapper.find('.game-field').trigger('pointerdown')
    await nextTick()

    expect(wrapper.find('.overlay').exists()).toBe(false)
    expect(wrapper.text()).toContain('running')
  })

  it('fait monter la rocket avec Space', async () => {
    const { runFrame } = createRafController()
    const wrapper = await mountGame()

    await wrapper.find('.game-field').trigger('pointerdown')
    await nextTick()

    const initialY = wrapper.vm.rocketY as number
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    runFrame(16)
    await nextTick()

    expect((wrapper.vm.rocketY as number)).toBeLessThan(initialY)
  })

  it('passe en game over en cas de collision', async () => {
    const { runFrame } = createRafController()
    const wrapper = await mountGame()

    await wrapper.find('.game-field').trigger('pointerdown')
    await nextTick()

    wrapper.vm.rocketY = 5
    runFrame(16)
    await nextTick()

    expect(wrapper.vm.gameStatus).toBe('gameover')
    expect(wrapper.emitted('finished')?.at(0)?.[0]).toEqual({ result: 'lose' })
  })

  it('augmente le score au passage d\'obstacle', async () => {
    const { runFrame } = createRafController()
    const wrapper = await mountGame()

    await wrapper.find('.game-field').trigger('pointerdown')
    await nextTick()

    wrapper.vm.rocketY = 180
    wrapper.vm.obstacles = [{ id: 1, x: 0, gapTop: 80, passed: false }]
    runFrame(16)
    await nextTick()

    expect(wrapper.vm.score).toBe(1)
  })

  it('restart réinitialise l\'état', async () => {
    const { runFrame } = createRafController()
    const wrapper = await mountGame()

    await wrapper.find('.game-field').trigger('pointerdown')
    await nextTick()

    wrapper.vm.rocketY = 5
    runFrame(16)
    await nextTick()
    expect(wrapper.vm.gameStatus).toBe('gameover')

    wrapper.vm.score = 8
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
    await nextTick()

    expect(wrapper.vm.gameStatus).toBe('running')
    expect(wrapper.vm.score).toBe(0)
    expect(wrapper.vm.obstacles).toHaveLength(3)
  })
})
