import { computed } from 'vue'
import { useAuthSessionStore, type UserProfile } from '~/stores/authSession'

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

  const token = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-session-initialized', () => false)

  const applySessionState = (session: SessionResponse) => {
    token.value = session.authenticated ? '__server_session__' : null
    authSession.setSession({
      token: token.value,
      profile: session.profile,
    })
  }

  const initSession = async () => {
    if (initialized.value) {
      return
    }

    try {
      const session = await $fetch<SessionResponse>('/api/auth/session', {
        method: 'GET',
      })
      applySessionState(session)
    }
    catch {
      applySessionState({ authenticated: false, profile: null, roles: [], locale: null })
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
    applySessionState(response)

    return response
  }

  const fetchProfile = async () => {
    const response = await $fetch<SessionResponse>('/api/auth/profile', {
      method: 'GET',
    })

    applySessionState(response)

    return response.profile
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    initialized.value = true
    applySessionState({ authenticated: false, profile: null, roles: [], locale: null })
  }

  void initSession()

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
