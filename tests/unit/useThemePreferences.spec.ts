import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mountComposable = async () => {
  const Harness = defineComponent({
    setup() {
      composableModule.useThemePreferences()
      return () => h('div')
    },
  })

  mount(Harness)
  await flushPromises()
  await flushPromises()
}

let composableModule: typeof import('~/app/composables/useThemePreferences')

describe('useThemePreferences', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  it('n’appelle pas l’endpoint de configuration distant sans token', async () => {
    const apiFetch = vi.fn()
    const theme = {
      global: { name: ref('light-pink') },
      themes: ref({
        light: { dark: false, colors: {}, variables: {} },
        dark: { dark: true, colors: {}, variables: {} },
        'light-pink': { dark: false, colors: {}, variables: {} },
      }),
      change: vi.fn(),
    }

    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: '' })))
    vi.stubGlobal('useApiClient', vi.fn(() => ({ apiFetch })))
    vi.doMock('vuetify', () => ({ useTheme: () => theme }))
    composableModule = await import('~/app/composables/useThemePreferences')

    await mountComposable()

    expect(apiFetch).not.toHaveBeenCalledWith('/api/v1/profile/configuration/user.dashboard.theme', expect.anything())
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('appelle l’endpoint de configuration distant avec token', async () => {
    const apiFetch = vi.fn().mockResolvedValue({})
    const theme = {
      global: { name: ref('light-pink') },
      themes: ref({
        light: { dark: false, colors: {}, variables: {} },
        dark: { dark: true, colors: {}, variables: {} },
        'light-pink': { dark: false, colors: {}, variables: {} },
      }),
      change: vi.fn(),
    }

    vi.stubGlobal('useAuthSessionStore', vi.fn(() => ({ token: 'token-123' })))
    vi.stubGlobal('useApiClient', vi.fn(() => ({ apiFetch })))
    vi.doMock('vuetify', () => ({ useTheme: () => theme }))
    composableModule = await import('~/app/composables/useThemePreferences')

    await mountComposable()

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/profile/configuration/user.dashboard.theme', {
      method: 'GET',
    })
  })
})
