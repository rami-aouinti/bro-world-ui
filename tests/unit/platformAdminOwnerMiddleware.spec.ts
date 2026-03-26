import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('platform-admin-owner global middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  const loadMiddleware = async () => {
    vi.stubGlobal('defineNuxtRouteMiddleware', vi.fn((handler: unknown) => handler))
    const module = await import('~/app/middleware/platform-admin-owner.global')

    return module.default
  }

  it('utilise to.params.slug + meta platformDomain pour vérifier l’accès admin', async () => {
    const resolveApplication = vi.fn().mockResolvedValue(undefined)
    const getDeniedRedirectPath = vi.fn().mockReturnValue('/platform/acme/crm/home')
    const navigateTo = vi.fn()
    const usePlatformPermissions = vi.fn(() => ({
      resolveApplication,
      canAccessAdmin: { value: true },
      getDeniedRedirectPath,
    }))

    vi.stubGlobal('usePlatformPermissions', usePlatformPermissions)
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      path: '/platform/acme/crm/admin',
      params: { slug: 'acme' },
      meta: { requiresPlatformAdmin: true, platformDomain: 'crm' },
    })

    expect(usePlatformPermissions).toHaveBeenCalledWith('acme')
    expect(resolveApplication).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
    expect(getDeniedRedirectPath).not.toHaveBeenCalled()
  })

  it('ignore une route invalide quand aucune meta admin n’est fournie', async () => {
    const resolveApplication = vi.fn().mockResolvedValue(undefined)
    const usePlatformPermissions = vi.fn(() => ({
      resolveApplication,
      canAccessAdmin: { value: true },
      getDeniedRedirectPath: vi.fn(),
    }))

    vi.stubGlobal('usePlatformPermissions', usePlatformPermissions)
    vi.stubGlobal('navigateTo', vi.fn())

    const middleware = await loadMiddleware()

    await middleware({
      path: '/profile',
      params: { slug: 'acme' },
      meta: {},
    })

    expect(usePlatformPermissions).not.toHaveBeenCalled()
    expect(resolveApplication).not.toHaveBeenCalled()
  })

  it('garde le fallback regex si la meta est absente', async () => {
    const resolveApplication = vi.fn().mockResolvedValue(undefined)
    const getDeniedRedirectPath = vi.fn().mockReturnValue('/platform/acme/recruit/home')
    const navigateTo = vi.fn()
    const usePlatformPermissions = vi.fn(() => ({
      resolveApplication,
      canAccessAdmin: { value: false },
      getDeniedRedirectPath,
    }))

    vi.stubGlobal('usePlatformPermissions', usePlatformPermissions)
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      path: '/platform/acme/recruit/admin',
      params: { slug: 'acme' },
      meta: {},
    })

    expect(usePlatformPermissions).toHaveBeenCalledWith('acme')
    expect(resolveApplication).toHaveBeenCalledTimes(1)
    expect(getDeniedRedirectPath).toHaveBeenCalledWith('recruit')
    expect(navigateTo).toHaveBeenCalledWith('/platform/acme/recruit/home')
  })

  it('redirige vers la route deny quand canAccessAdmin est false avec meta', async () => {
    const resolveApplication = vi.fn().mockResolvedValue(undefined)
    const getDeniedRedirectPath = vi.fn().mockReturnValue('/platform/acme/shop/home')
    const navigateTo = vi.fn()
    const usePlatformPermissions = vi.fn(() => ({
      resolveApplication,
      canAccessAdmin: { value: false },
      getDeniedRedirectPath,
    }))

    vi.stubGlobal('usePlatformPermissions', usePlatformPermissions)
    vi.stubGlobal('navigateTo', navigateTo)

    const middleware = await loadMiddleware()

    await middleware({
      path: '/platform/acme/shop/admin',
      params: { slug: 'acme' },
      meta: { requiresPlatformAdmin: true, platformDomain: 'shop' },
    })

    expect(resolveApplication).toHaveBeenCalledTimes(1)
    expect(getDeniedRedirectPath).toHaveBeenCalledWith('shop')
    expect(navigateTo).toHaveBeenCalledWith('/platform/acme/shop/home')
  })
})
