import { computed } from 'vue'
import { useAuthSessionStore } from '~/stores/authSession'
import { FALLBACK_LOCALE, getProfilePreferredLocale, normalizeLocaleCodes, resolveLocale } from '~/utils/locale'

import type { LoginPayload, RegisterPayload } from '~/types/api/common'
import type { SessionResponse, UserProfile } from '~/types/api/user'
import type { AuthState, UserProfileSnapshot } from '~/stores/authSession'

let activeSessionInitPromise: Promise<void> | null = null
let activeSessionInitCorrelationId: string | null = null

export const useAuth = () => {
  const authSession = useAuthSessionStore()
  const nuxtApp = useNuxtApp()

  const token = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-session-initialized', () => false)
  const warmupTaskIds = useState<number[]>('auth-warmup-task-ids', () => [])
  const warmupControllers = useState<AbortController[]>('auth-warmup-controllers', () => [])
  const warmupHooksRegistered = useState<boolean>('auth-warmup-hooks-registered', () => false)
  const warmupDoneForSessionId = useState<string | null>('auth-warmup-done-session-id', () => null)
  const sessionInitSequence = useState<number>('auth-session-init-sequence', () => 0)
  const sessionCorrelationId = useState<string | null>('auth-session-correlation-id', () => null)
  const authRevalidateInFlight = useState<Promise<void> | null>('auth-revalidate-in-flight', () => null)
  const lastAuthFailureAt = useState<number>('auth-last-auth-failure-at', () => 0)

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

  const resolveWarmupSessionId = (session: SessionResponse) => {
    if (!session.authenticated) {
      return null
    }

    return String(session.profile?.id || token.value || authSession.token || session.expiresAt || '__server_session__')
  }

  const warmupPrivateCachesOnce = (session: SessionResponse, trigger: 'login' | 'init-session') => {
    const warmupSessionId = resolveWarmupSessionId(session)

    if (!warmupSessionId || warmupDoneForSessionId.value === warmupSessionId) {
      logSessionFlow('warmup.skipped', {
        trigger,
        warmupSessionId,
        alreadyDone: warmupDoneForSessionId.value === warmupSessionId,
      })
      return
    }

    warmupDoneForSessionId.value = warmupSessionId
    logSessionFlow('warmup.started', { trigger, warmupSessionId })
    void warmupPrivateCaches(session)
  }

  const buildUserSnapshot = (profile: UserProfile): UserProfileSnapshot => ({
    id: profile.id,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    photo: profile.photo,
  })

  const applySessionState = async (session: SessionResponse) => {
    const incomingSnapshot = session.userSnapshot ?? null
    const existingToken = token.value || authSession.token || null
    token.value = session.authenticated
      ? (existingToken || '__server_session__')
      : null
    const shouldKeepExistingProfile = session.authenticated
      && session.sessionStatus === 'degraded'
      && !session.profile
      && !!authSession.profile
    const shouldUseSnapshot = session.authenticated
      && !session.profile
      && !shouldKeepExistingProfile
      && !!incomingSnapshot
    const mergedProfileFromSnapshotPhoto = session.authenticated
      && !session.profile
      && incomingSnapshot?.photo
      && authSession.profile
      ? {
          ...authSession.profile,
          photo: incomingSnapshot.photo,
        }
      : null

    const resolvedProfile = !session.authenticated
      ? null
      : (session.profile
        || (shouldKeepExistingProfile ? authSession.profile : null)
        || mergedProfileFromSnapshotPhoto
        || (shouldUseSnapshot ? incomingSnapshot as UserProfile : null)
        || authSession.profile)

    const profilePartial = Boolean(session.authenticated && resolvedProfile && !session.profile
      && (shouldUseSnapshot || authSession.profilePartial))

    const nextAuthState: AuthState = !session.authenticated
      ? 'unauthenticated'
      : (session.sessionStatus === 'degraded' ? 'degraded' : 'authenticated')

    authSession.setUserSession({
      token: token.value,
      profile: resolvedProfile,
      userSnapshot: session.authenticated
        ? (session.profile ? buildUserSnapshot(session.profile) : (incomingSnapshot || authSession.userSnapshot))
        : null,
      profilePartial,
      roles: session.roles,
      locale: session.locale,
      profileUnavailable: session.sessionStatus === 'degraded',
      sessionStatus: session.sessionStatus ?? (session.authenticated ? 'healthy' : 'invalid'),
      authState: nextAuthState,
    })

    const preferredLocale = session.authenticated
      ? (session.locale || getProfilePreferredLocale(resolvedProfile))
      : FALLBACK_LOCALE

    await applyLocalePreference(preferredLocale)
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
    // GARDE AUTH: cette fonction ne doit être appelée que par `logout()`.
    // Le token ne doit jamais être supprimé automatiquement.
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
    if (activeSessionInitPromise) {
      logSessionFlow('session.init.reused', {
        force,
        activeCorrelationId: activeSessionInitCorrelationId,
      })
      await activeSessionInitPromise
      return
    }

    if (initialized.value && !force) {
      return
    }

    const correlationId = createCorrelationId(force ? 'session-revalidate' : 'session-init')
    sessionCorrelationId.value = correlationId
    activeSessionInitCorrelationId = correlationId
    authSession.authState = 'initializing'

    activeSessionInitPromise = (async () => {
      logSessionFlow('session.init.start', { force })

      try {
        const baseSession = await authFetch<SessionResponse>('/api/auth/session', {
          method: 'GET',
        })

        logSessionFlow('session.endpoint.done', { authenticated: baseSession.authenticated })

        if (!baseSession.authenticated) {
          await applySessionState({
            authenticated: false,
            profile: null,
            roles: [],
            locale: null,
            sessionStatus: 'invalid',
          })
          return
        }

        await applySessionState(baseSession)

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
          warmupPrivateCachesOnce({
            ...baseSession,
            ...profileSession,
            authenticated: true,
            sessionStatus: 'healthy',
          }, 'init-session')
        }
        catch (profileError) {
          const profileStatus = getErrorStatus(profileError)
          logSessionFlow('profile.endpoint.error', { status: profileStatus })

          await applySessionState({
            authenticated: true,
            profile: authSession.profile || baseSession.profile,
            roles: baseSession.roles,
            locale: baseSession.locale,
            sessionStatus: 'degraded',
          })
          warmupPrivateCachesOnce({
            authenticated: true,
            profile: authSession.profile || baseSession.profile,
            roles: baseSession.roles,
            locale: baseSession.locale,
            sessionStatus: 'degraded',
          }, 'init-session')
        }
      }
      catch (sessionError) {
        const sessionStatusCode = getErrorStatus(sessionError)
        logSessionFlow('session.endpoint.error', { status: sessionStatusCode })

        const hasLocalSession = Boolean(token.value || authSession.token || authSession.profile)

        if (hasLocalSession) {
          await applySessionState({
            authenticated: true,
            profile: authSession.profile,
            roles: authSession.roles,
            locale: authSession.locale,
            sessionStatus: 'degraded',
          })
          warmupPrivateCachesOnce({
            authenticated: true,
            profile: authSession.profile,
            roles: authSession.roles,
            locale: authSession.locale,
            sessionStatus: 'degraded',
          }, 'init-session')
          return
        }

        await applySessionState({
          authenticated: false,
          profile: null,
          roles: [],
          locale: null,
          sessionStatus: 'invalid',
        })
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
      activeSessionInitCorrelationId = null
    }
  }

  const isAuthenticated = computed(() => authSession.authState === 'authenticated' || authSession.authState === 'degraded')
  const authState = computed(() => authSession.authState)

  const awaitAuthReady = async () => {
    if (authSession.authState !== 'initializing' && initialized.value) {
      return
    }

    await initSession()
  }

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
    if (response.authenticated) {
      warmupPrivateCachesOnce(response, 'login')
    }
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

    if (response.profile) {
      await applySessionState({
        ...response,
        userSnapshot: buildUserSnapshot(response.profile),
      })
    }
    else {
      await applySessionState(response)
    }

    return response.profile
  }

  const logout = async () => {
    if (import.meta.client) {
      cancelWarmupQueue()
    }

    await authFetch('/api/auth/logout', { method: 'POST' })
    initialized.value = true
    warmupDoneForSessionId.value = null
    await clearLocalSession()
  }

  return {
    token,
    initialized,
    initSession,
    isAuthenticated,
    authState,
    awaitAuthReady,
    login,
    register,
    fetchProfile,
    logout,
    sessionCorrelationId,
    authRevalidateInFlight,
    lastAuthFailureAt,
  }
}
