export const useApiClient = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const apiFetch = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const headers = new Headers(options?.headers as HeadersInit)

    if (token.value) {
      headers.set('Authorization', `Bearer ${token.value}`)
    }

    return $fetch<T>(url, {
      ...options,
      baseURL: config.public.apiBase,
      headers,
    })
  }

  return {
    apiFetch,
  }
}
