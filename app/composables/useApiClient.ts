const SERVER_SESSION_PLACEHOLDER = '__server_session__'
const CRITICAL_API_PATTERNS = [
  'api/v1/auth',
  'api/v1/applications',
  'api/v1/crm',
]

const normalizeApiPath = (url: string) => url.replace(/^\/+/, '')

const isCriticalApiCall = (normalizedUrl: string) => CRITICAL_API_PATTERNS.some(pattern => normalizedUrl.includes(pattern))

const now = () => (import.meta.client ? performance.now() : Date.now())

export const useApiClient = () => {
  const authSession = useAuthSessionStore()
  const tracker = useTracker()
  const requestHeaders = import.meta.server ? useRequestHeaders(['authorization']) : {}

  const apiFetch = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const normalizedUrl = normalizeApiPath(url)
    const token = authSession.token
    const hasBearerToken = Boolean(token && token !== SERVER_SESSION_PLACEHOLDER)
    const requestAuthorization = requestHeaders.authorization
    const startedAt = now()

    const nextHeaders: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (!nextHeaders.Authorization && hasBearerToken) {
      nextHeaders.Authorization = `Bearer ${token}`
    }

    if (!nextHeaders.Authorization && requestAuthorization) {
      nextHeaders.Authorization = requestAuthorization
    }

    try {
      const response = await $fetch<T>(`/api/backend/${normalizedUrl}`, {
        ...options,
        credentials: 'include',
        headers: nextHeaders,
      })

      if (isCriticalApiCall(normalizedUrl)) {
        tracker.trackLatency(normalizedUrl, startedAt, {
          method: options.method || 'GET',
          status: 'success',
        })
      }

      return response
    }
    catch (error) {
      if (isCriticalApiCall(normalizedUrl)) {
        tracker.trackLatency(normalizedUrl, startedAt, {
          method: options.method || 'GET',
          status: 'error',
        })
      }

      tracker.trackError('api.request.failed', error, {
        path: normalizedUrl,
        method: options.method || 'GET',
      })

      throw error
    }
  }

  return {
    apiFetch,
  }
}
