import { computed } from 'vue'

interface AuthResponse {
  token: string
}

interface LoginPayload {
  username: string
  password: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()

  const tokenCookie = useCookie<string | null>('auth_token', {
    sameSite: 'lax',
    secure: false,
  })

  const token = useState<string | null>('auth-token', () => tokenCookie.value ?? null)

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

    return response
  }

  const logout = () => {
    token.value = null
    tokenCookie.value = null
  }

  return {
    token,
    isAuthenticated,
    login,
    logout,
  }
}
