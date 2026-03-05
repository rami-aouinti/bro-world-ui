import { computed } from 'vue'
import { useAuthSessionStore, type UserProfile } from '~/stores/authSession'
import { FALLBACK_LOCALE, getProfilePreferredLocale, resolveLocale } from '~/utils/locale'

interface SessionResponse {
  authenticated: boolean
  profile: UserProfile | null
  roles: string[]
  locale: string | null
  expiresAt?: string
}

interface LoginPayload {
  username: string
  password: string
}

export const useAuth = () => {
  const authSession = useAuthSessionStore()
  const nuxtApp = useNuxtApp()

  const token = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-session-initialized', () => false)

  const applyLocalePreference = async (preferredLocale: unknown) => {
    const i18n = nuxtApp.$i18n
    const availableLocales = i18n.localeCodes || []
    const localeToApply = resolveLocale(preferredLocale, availableLocales, FALLBACK_LOCALE)

    if (i18n.locale.value !== localeToApply) {
      await i18n.setLocale(localeToApply)
    }
  }

  const applySessionState = async (session: SessionResponse) => {
    token.value = session.authenticated ? '__server_session__' : null
    authSession.setSession({
      token: token.value,
      profile: session.profile,
    })

    const preferredLocale = session.authenticated
      ? (session.locale || getProfilePreferredLocale(session.profile))
      : FALLBACK_LOCALE

    await applyLocalePreference(preferredLocale)
  }

  const initSession = async () => {
    if (initialized.value) {
      return
    }

    try {
      const session = await $fetch<SessionResponse>('/api/auth/session', {
        method: 'GET',
      })
      await applySessionState(session)
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

    const response = await $fetch<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })

    initialized.value = true
    await applySessionState(response)

    return response
  }

  const fetchProfile = async () => {
    const response = await $fetch<SessionResponse>('/api/auth/profile', {
      method: 'GET',
    })

    await applySessionState(response)

    return response.profile
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    initialized.value = true
    await applySessionState({ authenticated: false, profile: null, roles: [], locale: null })
  }

  return {
    token,
    initialized,
    initSession,
    isAuthenticated,
    login,
    fetchProfile,
    logout,
  }
}
