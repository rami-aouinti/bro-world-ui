import { computed } from 'vue'
import { useAuthSessionStore } from '~/stores/authSession'
import { FALLBACK_LOCALE, getProfilePreferredLocale, normalizeLocaleCodes, resolveLocale } from '~/utils/locale'

import type { LoginPayload, RegisterPayload } from '~/types/api/common'
import type { SessionResponse } from '~/types/api/user'

let activeSessionInitPromise: Promise<void> | null = null

export const useAuth = () => {
  const authSession = useAuthSessionStore()
  const nuxtApp = useNuxtApp()

  const token = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-session-initialized', () => false)
  const warmupTaskIds = useState<number[]>('auth-warmup-task-ids', () => [])
  const warmupControllers = useState<AbortController[]>('auth-warmup-controllers', () => [])
  const warmupHooksRegistered = useState<boolean>('auth-warmup-hooks-registered', () => false)
  const sessionInitSequence = useState<number>('auth-session-init-sequence', () => 0)
  const sessionCorrelationId = useState<string | null>('auth-session-correlation-id', () => null)

  const authFetch = <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    if (import.meta.server) {
      const requestFetch = useRequestFetch()
      const requestHeaders = useRequestHeaders(['cookie'])

      return requestFetch<T>(url, {
        ...options,
        headers: {
          ...requestHeaders,
          ...(options.headers || {}),
        },
      })
    }

    return $fetch<T>(url, options)
  }

  const applyLocalePreference = async (preferredLocale: unknown) => {
    const i18n = nuxtApp.$i18n
    const availableLocales = normalizeLocaleCodes(i18n.localeCodes)
    const localeToApply = resolveLocale(preferredLocale, availableLocales, FALLBACK_LOCALE)

    if (i18n.locale.value !== localeToApply) {
      await i18n.setLocale(localeToApply)
    }
  }

  const isSensitiveNavigation = (targetPath: string) => {
    const sensitivePrefixes = ['/login', '/register', '/logout', '/auth']

    return sensitivePrefixes.some(prefix => targetPath.startsWith(prefix))
  }

  const cancelWarmupQueue = () => {
    warmupTaskIds.value.forEach(taskId => window.clearTimeout(taskId))
    warmupTaskIds.value = []

    warmupControllers.value.forEach(controller => controller.abort())
    warmupControllers.value = []
  }

  const registerWarmupCancellationHooks = () => {
    if (import.meta.server || warmupHooksRegistered.value) {
      return
    }

    const router = useRouter()

    router.beforeEach((to) => {
      if (isSensitiveNavigation(to.path)) {
        cancelWarmupQueue()
      }
    })

    warmupHooksRegistered.value = true
  }

  const queueLowPriorityWarmup = (task: () => Promise<void>, delayMs = 250) => {
    if (import.meta.server) {
      return
    }

    const taskId = window.setTimeout(async () => {
      warmupTaskIds.value = warmupTaskIds.value.filter(id => id !== taskId)
      await task()
    }, delayMs)

    warmupTaskIds.value = [...warmupTaskIds.value, taskId]
  }


  const warmupPrivateCaches = async (session: SessionResponse) => {
    if (!session.authenticated || import.meta.server) {
      return
    }

    registerWarmupCancellationHooks()
    cancelWarmupQueue()

    const warmupRequests = [
      (signal: AbortSignal) => authFetch('/api/backend/api/v1/notifications', {
        method: 'GET',
        signal,
        query: {
          limit: 3,
          offset: 0,
        },
      }),
      (signal: AbortSignal) => authFetch('/api/backend/api/v1/chat/private/conversations', {
        method: 'GET',
        signal,
        query: {
          limit: 20,
          page: 1,
        },
      }),
    ]

    warmupRequests.forEach((request, index) => {
      queueLowPriorityWarmup(async () => {
        const controller = new AbortController()
        warmupControllers.value = [...warmupControllers.value, controller]

        try {
          await request(controller.signal)
        }
        catch (error) {
          if ((error as { name?: string })?.name !== 'AbortError') {
            console.warn('Auth warmup cache failed', error)
          }
        }
        finally {
          warmupControllers.value = warmupControllers.value.filter(activeController => activeController !== controller)
        }
      }, 250 + (index * 150))
    })
  }

  const applySessionState = async (session: SessionResponse) => {
    token.value = session.authenticated ? '__server_session__' : null
    const shouldKeepExistingProfile = session.authenticated
      && session.sessionStatus === 'degraded'
      && !session.profile
      && !!authSession.profile

    authSession.setUserSession({
      token: token.value,
      profile: shouldKeepExistingProfile ? authSession.profile : session.profile,
      roles: session.roles,
      locale: session.locale,
      profileUnavailable: session.sessionStatus === 'degraded',
      sessionStatus: session.sessionStatus ?? (session.authenticated ? 'healthy' : 'invalid'),
    })

    const preferredLocale = session.authenticated
      ? (session.locale || getProfilePreferredLocale(shouldKeepExistingProfile ? authSession.profile : session.profile))
      : FALLBACK_LOCALE

    await applyLocalePreference(preferredLocale)
    void warmupPrivateCaches(session)
  }

  const getErrorStatus = (error: unknown): number | null => {
    if (!error || typeof error !== 'object') {
      return null
    }

    const candidate = error as {
      statusCode?: unknown
      status?: unknown
      response?: { status?: unknown }
    }

    if (typeof candidate.statusCode === 'number') {
      return candidate.statusCode
    }

    if (typeof candidate.status === 'number') {
      return candidate.status
    }

    if (typeof candidate.response?.status === 'number') {
      return candidate.response.status
    }

    return null
  }

  const clearLocalSession = async () => {
    await applySessionState({
      authenticated: false,
      profile: null,
      roles: [],
      locale: null,
      sessionStatus: 'invalid',
    })
  }

  const createCorrelationId = (prefix: string) => {
    sessionInitSequence.value += 1

    return `${prefix}-${Date.now()}-${sessionInitSequence.value}`
  }

  const logSessionFlow = (event: string, details: Record<string, unknown> = {}) => {
    console.info('[auth-correlation]', {
      event,
      sessionCorrelationId: sessionCorrelationId.value,
      ...details,
    })
  }

  const initSession = async (force = false) => {
    if (!force && activeSessionInitPromise) {
      logSessionFlow('session.init.reused', { force })
      await activeSessionInitPromise
      return
    }

    if (initialized.value && !force) {
      return
    }

    const correlationId = createCorrelationId(force ? 'session-revalidate' : 'session-init')
    sessionCorrelationId.value = correlationId

    activeSessionInitPromise = (async () => {
      logSessionFlow('session.init.start', { force })

      try {
        const baseSession = await authFetch<SessionResponse>('/api/auth/session', {
          method: 'GET',
        })

        logSessionFlow('session.endpoint.done', { authenticated: baseSession.authenticated })

        if (!baseSession.authenticated) {
          await clearLocalSession()
          return
        }

        try {
          const profileSession = await authFetch<SessionResponse>('/api/auth/profile', {
            method: 'GET',
          })
          logSessionFlow('profile.endpoint.done', { hasProfile: Boolean(profileSession.profile) })
          await applySessionState({
            ...baseSession,
            ...profileSession,
            authenticated: true,
            sessionStatus: 'healthy',
          })
        }
        catch (profileError) {
          const profileStatus = getErrorStatus(profileError)
          logSessionFlow('profile.endpoint.error', { status: profileStatus })

          if (profileStatus === 401 || profileStatus === 403) {
            await clearLocalSession()
            return
          }

          await applySessionState({
            authenticated: true,
            profile: baseSession.profile,
            roles: baseSession.roles,
            locale: baseSession.locale,
            sessionStatus: 'degraded',
          })
        }
      }
      catch (sessionError) {
        const sessionStatusCode = getErrorStatus(sessionError)
        logSessionFlow('session.endpoint.error', { status: sessionStatusCode })

        if (sessionStatusCode === 401 || sessionStatusCode === 403) {
          await clearLocalSession()
        }
        else if (token.value) {
          await applySessionState({
            authenticated: true,
            profile: authSession.profile,
            roles: authSession.roles,
            locale: authSession.locale,
            sessionStatus: 'degraded',
          })
        }
        else {
          await clearLocalSession()
        }
      }
      finally {
        initialized.value = true
        logSessionFlow('session.init.complete', { force, initialized: initialized.value })
      }
    })()

    try {
      await activeSessionInitPromise
    }
    finally {
      activeSessionInitPromise = null
    }
  }

  const isAuthenticated = computed(() => Boolean(token.value))

  const login = async (usernameOrEmail: string, password: string) => {
    const payload: LoginPayload = {
      username: usernameOrEmail,
      password,
    }
    const correlationId = createCorrelationId('login')
    sessionCorrelationId.value = correlationId
    logSessionFlow('login.start', { username: usernameOrEmail })

    const response = await authFetch<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })

    initialized.value = true
    await applySessionState(response)
    logSessionFlow('login.complete', { authenticated: response.authenticated })

    return response
  }


  const register = async (email: string, password: string, repeatPassword: string) => {
    const payload: RegisterPayload = {
      email,
      password,
      repeatPassword,
    }

    const response = await authFetch<SessionResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })

    initialized.value = true
    await applySessionState(response)

    return response
  }

  const fetchProfile = async () => {
    const response = await authFetch<SessionResponse>('/api/auth/profile', {
      method: 'GET',
    })

    await applySessionState(response)

    return response.profile
  }

  const logout = async () => {
    if (import.meta.client) {
      cancelWarmupQueue()
    }

    await authFetch('/api/auth/logout', { method: 'POST' })
    initialized.value = true
    await clearLocalSession()
  }

  return {
    token,
    initialized,
    initSession,
    isAuthenticated,
    login,
    register,
    fetchProfile,
    logout,
    sessionCorrelationId,
  }
}
