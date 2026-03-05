import { computed } from 'vue'
import { useAuthSessionStore, type UserProfile } from '~/stores/authSession'

interface AuthResponse {
  token: string
}

interface LoginPayload {
  username: string
  password: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const authSession = useAuthSessionStore()

  const tokenCookie = useCookie<string | null>('auth_token', {
    sameSite: 'lax',
    secure: false,
  })

  const token = useState<string | null>('auth-token', () => tokenCookie.value ?? null)

  authSession.setToken(token.value)

  const isAuthenticated = computed(() => Boolean(token.value))

  const login = async (usernameOrEmail: string, password: string) => {
    const payload: LoginPayload = {
      username: usernameOrEmail,
      password,
    }

    const response = await $fetch<AuthResponse>('/api/v1/auth/get_token', {
      method: 'POST',
      baseURL: config.public.apiBase,
      body: payload,
    })

    token.value = response.token
    tokenCookie.value = response.token
    authSession.setToken(response.token)

    return response
  }

  const fetchProfile = async () => {
    if (!token.value) {
      throw new Error('Missing auth token')
    }

    return $fetch<UserProfile>('/api/v1/profile', {
      method: 'GET',
      baseURL: config.public.apiBase,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    })
  }

  const logout = () => {
    token.value = null
    tokenCookie.value = null
    authSession.clearSession()
  }

  return {
    token,
    isAuthenticated,
    login,
    fetchProfile,
    logout,
  }
}
