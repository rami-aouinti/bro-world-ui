import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const makeStub = (name: string) => defineComponent({
  name,
  props: ['label'],
  setup(props, { slots }) {
    return () => h('div', {}, [props.label as string, slots.default?.()])
  },
})

describe('notifications page', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ profile: { id: 'u1' } })))
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key })))
    vi.stubGlobal('nextTick', vi.fn(() => Promise.resolve()))
  })

  it('affiche le loading puis la liste des notifications', async () => {
    const req = deferred<{ items: Array<{ id: string, title: string }> }>()
    vi.doMock('~/composables/api/useNotificationsApi', () => ({
      useNotificationsApi: () => ({ getNotifications: vi.fn(() => req.promise) }),
    }))
    vi.doMock('~/composables/useNotificationTarget', () => ({
      useNotificationTarget: () => ({ getNotificationTarget: () => null }),
    }))
    vi.doMock('~/composables/useMercureEventSource', () => ({
      useMercureEventSource: vi.fn(),
    }))

    const Page = (await import('~/app/pages/notifications/index.vue')).default
    const wrapper = mount(Page, {
      global: {
        stubs: {
          PlatformSplitLayout: makeStub('PlatformSplitLayout'),
          UiListCard: makeStub('UiListCard'),
          UiSectionHeader: makeStub('UiSectionHeader'),
          'v-row': makeStub('v-row'),
          'v-col': makeStub('v-col'),
          'v-chip': makeStub('v-chip'),
          'v-list': makeStub('v-list'),
          'v-list-item': makeStub('v-list-item'),
          'v-list-item-title': makeStub('v-list-item-title'),
          'v-avatar': makeStub('v-avatar'),
          'v-img': makeStub('v-img'),
          'v-icon': makeStub('v-icon'),
          'v-skeleton-loader': makeStub('v-skeleton-loader'),
          'v-alert': makeStub('v-alert'),
        },
      },
    })

    expect(wrapper.html()).toContain('v-skeleton-loader')

    req.resolve({ items: [{ id: 'n1', title: 'Notif 1' }] })
    await flushPromises()

    expect(wrapper.text()).toContain('Notif 1')
  })

  it('affiche le message i18n en cas d’erreur', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('~/composables/api/useNotificationsApi', () => ({
      useNotificationsApi: () => ({ getNotifications: vi.fn().mockRejectedValue(new Error('boom')) }),
    }))
    vi.doMock('~/composables/useNotificationTarget', () => ({
      useNotificationTarget: () => ({ getNotificationTarget: () => null }),
    }))
    vi.doMock('~/composables/useMercureEventSource', () => ({
      useMercureEventSource: vi.fn(),
    }))

    const Page = (await import('~/app/pages/notifications/index.vue')).default
    const wrapper = mount(Page, {
      global: {
        stubs: {
          PlatformSplitLayout: makeStub('PlatformSplitLayout'),
          UiListCard: makeStub('UiListCard'),
          UiSectionHeader: makeStub('UiSectionHeader'),
          'v-row': makeStub('v-row'),
          'v-col': makeStub('v-col'),
          'v-chip': makeStub('v-chip'),
          'v-list': makeStub('v-list'),
          'v-list-item': makeStub('v-list-item'),
          'v-list-item-title': makeStub('v-list-item-title'),
          'v-avatar': makeStub('v-avatar'),
          'v-img': makeStub('v-img'),
          'v-icon': makeStub('v-icon'),
          'v-skeleton-loader': makeStub('v-skeleton-loader'),
          'v-alert': makeStub('v-alert'),
        },
      },
    })

    await flushPromises()

    expect(console.error).toHaveBeenCalled()
    expect(wrapper.text()).toContain('notificationsPage.errors.loadCalendarEvents')
  })
})
