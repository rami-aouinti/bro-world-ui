import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('auth-guard global middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  const loadMiddleware = async () => {
    vi.stubGlobal('defineNuxtRouteMiddleware', vi.fn((handler: unknown) => handler))
    const module = await import('~/app/middleware/auth-guard.global')

    return module.default
  }

  it('redirige vers /login pour une page privée si utilisateur non connecté', async () => {
    const initSession = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useAuth', () => ({
      initialized: { value: false },
      initSession,
      isAuthenticated: { value: false },
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      meta: { requiresAuth: true },
      fullPath: '/settings/accounts',
    })

    expect(initSession).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/login?redirect=%2Fsettings%2Faccounts')
  })

  it('laisse passer une page privée si utilisateur connecté', async () => {
    const initSession = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useAuth', () => ({
      initialized: { value: false },
      initSession,
      isAuthenticated: { value: true },
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      meta: { requiresAuth: true },
      fullPath: '/profile',
    })

    expect(initSession).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('n’applique pas de redirection pour une page publique', async () => {
    const initSession = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useAuth', () => ({
      initialized: { value: true },
      initSession,
      isAuthenticated: { value: false },
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      meta: { public: true },
      fullPath: '/about',
    })

    expect(initSession).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('encode correctement la query redirect', async () => {
    const initSession = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useAuth', () => ({
      initialized: { value: false },
      initSession,
      isAuthenticated: { value: false },
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      meta: { requiresAuth: true },
      fullPath: '/inbox?tab=unread&page=2',
    })

    expect(navigateTo).toHaveBeenCalledWith('/login?redirect=%2Finbox%3Ftab%3Dunread%26page%3D2')
  })
})
