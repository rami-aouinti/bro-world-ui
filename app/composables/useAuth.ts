import { computed } from 'vue'
import { useAuthSessionStore } from '~/stores/authSession'
import { FALLBACK_LOCALE, getProfilePreferredLocale, normalizeLocaleCodes, resolveLocale } from '~/utils/locale'

import type { LoginPayload, RegisterPayload } from '~/types/api/common'
import type { SessionResponse } from '~/types/api/user'

export const useAuth = () => {
  const authSession = useAuthSessionStore()
  const nuxtApp = useNuxtApp()

  const token = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-session-initialized', () => false)
  const warmupTaskIds = useState<number[]>('auth-warmup-task-ids', () => [])
  const warmupControllers = useState<AbortController[]>('auth-warmup-controllers', () => [])
  const warmupHooksRegistered = useState<boolean>('auth-warmup-hooks-registered', () => false)

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
    authSession.setUserSession({
      token: token.value,
      profile: session.profile,
      roles: session.roles,
      locale: session.locale,
    })

    const preferredLocale = session.authenticated
      ? (session.locale || getProfilePreferredLocale(session.profile))
      : FALLBACK_LOCALE

    await applyLocalePreference(preferredLocale)
    void warmupPrivateCaches(session)
  }

  const initSession = async (force = false) => {
    if (initialized.value && !force) {
      return
    }

    try {
      const session = await authFetch<SessionResponse>('/api/auth/session', {
        method: 'GET',
      })

      if (!session.authenticated) {
        await applySessionState(session)
        return
      }

      const profileSession = await authFetch<SessionResponse>('/api/auth/profile', {
        method: 'GET',
      })
      await applySessionState(profileSession)
    }
    catch {
      await applySessionState({ authenticated: false, profile: null, roles: [], locale: null })
    }
    finally {
      initialized.value = true
    }
  }

  const isAuthenticated = computed(() => Boolean(token.value))

  const login = async (usernameOrEmail: string, password: string) => {
    const payload: LoginPayload = {
      username: usernameOrEmail,
      password,
    }

    const response = await authFetch<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })

    initialized.value = true
    await applySessionState(response)

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
    await applySessionState({ authenticated: false, profile: null, roles: [], locale: null })
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
  }
}
