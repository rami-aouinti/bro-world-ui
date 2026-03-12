const SERVER_SESSION_PLACEHOLDER = '__server_session__'

export const useApiClient = () => {
  const authSession = useAuthSessionStore()
  const requestHeaders = import.meta.server ? useRequestHeaders(['authorization']) : {}

  const apiFetch = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const normalizedUrl = url.replace(/^\/+/, '')
    const token = authSession.token
    const hasBearerToken = Boolean(token && token !== SERVER_SESSION_PLACEHOLDER)
    const requestAuthorization = requestHeaders.authorization

    const nextHeaders: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (!nextHeaders.Authorization && hasBearerToken) {
      nextHeaders.Authorization = `Bearer ${token}`
    }

    if (!nextHeaders.Authorization && requestAuthorization) {
      nextHeaders.Authorization = requestAuthorization
    }

    return $fetch<T>(`/api/backend/${normalizedUrl}`, {
      ...options,
      credentials: 'include',
      headers: nextHeaders,
    })
  }

  return {
    apiFetch,
  }
}
