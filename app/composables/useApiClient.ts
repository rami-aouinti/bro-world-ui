const SERVER_SESSION_PLACEHOLDER = '__server_session__'
const CRITICAL_API_PATTERNS = [
  'api/v1/auth',
  'api/v1/applications',
  'api/v1/crm',
]
const RETRYABLE_NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
  'ABORT_ERR',
])
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const RETRY_DELAYS_IN_MS = [150, 300]
const MAX_ATTEMPTS = 3
const SESSION_REVALIDATION_THROTTLE_WINDOW_MS = 10_000
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const inFlightRequests = new Map<string, Promise<unknown>>()
let lastSessionRevalidationAt = 0
let activeSessionRevalidation: Promise<void> | null = null

const normalizeApiPath = (url: string) => url.replace(/^\/+/, '')

const isCriticalApiCall = (normalizedUrl: string) => CRITICAL_API_PATTERNS.some(pattern => normalizedUrl.includes(pattern))

const now = () => (import.meta.client ? performance.now() : Date.now())
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  retryUnsafeMutations?: boolean
  idempotencyKey?: string
}

const resolveMethod = (method: string | undefined) => (method || 'GET').toUpperCase()
const stableSerialize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableSerialize(item)).join(',')}]`
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    const keys = Object.keys(objectValue).sort((firstKey, secondKey) => firstKey.localeCompare(secondKey))

    return `{${keys.map(key => `${key}:${stableSerialize(objectValue[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

const hashValue = (value: string): string => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }

  return Math.abs(hash).toString(36)
}

const buildRequestDedupeKey = (method: string, normalizedUrl: string, options: ApiFetchOptions<unknown>) => {
  const query = stableSerialize(options.query)
  const bodyHash = hashValue(stableSerialize(options.body))

  return `${method}|${normalizedUrl}|${query}|${bodyHash}`
}

const isRetryableNetworkError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const networkError = error as {
    name?: string
    code?: string
    status?: number
    response?: { status?: number }
    message?: string
  }

  const status = networkError.status ?? networkError.response?.status

  if (status && RETRYABLE_HTTP_STATUSES.has(status)) {
    return true
  }

  if (status) {
    return false
  }

  if (networkError.code && RETRYABLE_NETWORK_ERROR_CODES.has(networkError.code)) {
    return true
  }

  return networkError.name === 'FetchError'
    || networkError.message?.toLowerCase().includes('network')
    || networkError.message?.toLowerCase().includes('failed to fetch')
}

const revalidateSessionWithGlobalThrottle = async (auth: ReturnType<typeof useAuth>) => {
  const currentTime = now()
  const isWithinThrottleWindow = currentTime - lastSessionRevalidationAt < SESSION_REVALIDATION_THROTTLE_WINDOW_MS

  if (isWithinThrottleWindow) {
    if (activeSessionRevalidation) {
      await activeSessionRevalidation
    }

    return false
  }

  if (!activeSessionRevalidation) {
    activeSessionRevalidation = (async () => {
      try {
        await auth.initSession(true)
        lastSessionRevalidationAt = now()
      }
      finally {
        activeSessionRevalidation = null
      }
    })()
  }

  await activeSessionRevalidation

  return true
}

export const useApiClient = () => {
  const authSession = useAuthSessionStore()
  const tracker = useTracker()
  const auth = useAuth()
  const requestHeaders = import.meta.server ? useRequestHeaders(['authorization']) : {}

  const apiFetch = async <T>(url: string, options: ApiFetchOptions<T> = {}) => {
    const normalizedUrl = normalizeApiPath(url)
    const token = authSession.token
    const hasBearerToken = Boolean(token && token !== SERVER_SESSION_PLACEHOLDER)
    const requestAuthorization = requestHeaders.authorization
    const startedAt = now()
    const method = resolveMethod(options.method)
    const requestCorrelationId = `${method.toLowerCase()}-${Date.now()}-${hashValue(`${normalizedUrl}:${Math.random()}`)}`
    const dedupeKey = buildRequestDedupeKey(method, normalizedUrl, options as ApiFetchOptions<unknown>)
    const existingRequest = inFlightRequests.get(dedupeKey) as Promise<T> | undefined

    if (existingRequest) {
      tracker.track('api.request.deduplicated', {
        path: normalizedUrl,
        method,
      })

      return existingRequest
    }
    const isMutation = MUTATION_METHODS.has(method)
    const canRetryMutation = Boolean(options.idempotencyKey || options.retryUnsafeMutations)
    const canRetry = !isMutation || canRetryMutation

    const nextHeaders: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (!nextHeaders.Authorization && hasBearerToken) {
      nextHeaders.Authorization = `Bearer ${token}`
    }

    if (!nextHeaders.Authorization && requestAuthorization) {
      nextHeaders.Authorization = requestAuthorization
    }

    if (options.idempotencyKey && !nextHeaders['Idempotency-Key']) {
      nextHeaders['Idempotency-Key'] = options.idempotencyKey
    }

    const requestPromise = (async () => {
      try {
        const fetchOptions = { ...options } as Parameters<typeof $fetch<T>>[1] & {
          retryUnsafeMutations?: boolean
          idempotencyKey?: string
        }
        delete fetchOptions.retryUnsafeMutations
        delete fetchOptions.idempotencyKey

        let lastError: unknown = null

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          try {
            const response = await $fetch<T>(`/api/backend/${normalizedUrl}`, {
              ...fetchOptions,
              credentials: 'include',
              headers: nextHeaders,
            })

            if (auth.isAuthenticated.value) {
              console.info('[auth-correlation]', {
                event: 'private.api.success',
                requestCorrelationId,
                sessionCorrelationId: auth.sessionCorrelationId.value,
                path: normalizedUrl,
                method,
                attempt,
              })
            }

            if (isCriticalApiCall(normalizedUrl)) {
              tracker.trackLatency(normalizedUrl, startedAt, {
                method,
                status: 'success',
                dedupeKey,
              })
            }

            return response
          }
          catch (error) {
            lastError = error

            const status = (error as { status?: number, response?: { status?: number } })?.status
              ?? (error as { response?: { status?: number } })?.response?.status
            const is401 = status === 401
            const isRetryableError = isRetryableNetworkError(error)
            const hasRemainingAttempts = attempt < MAX_ATTEMPTS

            if (is401) {
              const didRevalidateSession = await revalidateSessionWithGlobalThrottle(auth)

              if (didRevalidateSession) {
                console.info('[auth-correlation]', {
                  event: 'session.revalidation.confirmed_401',
                  requestCorrelationId,
                  sessionCorrelationId: auth.sessionCorrelationId.value,
                  path: normalizedUrl,
                  method,
                })
              }

              break
            }

            if (!(isRetryableError && hasRemainingAttempts && canRetry)) {
              break
            }

            const delay = RETRY_DELAYS_IN_MS[attempt - 1] ?? RETRY_DELAYS_IN_MS[RETRY_DELAYS_IN_MS.length - 1]
            await sleep(delay)
          }
        }

        throw lastError
      }
      catch (error) {
        if (isCriticalApiCall(normalizedUrl)) {
          tracker.trackLatency(normalizedUrl, startedAt, {
            method,
            status: 'error',
            dedupeKey,
          })
        }

        tracker.trackError('api.request.failed', error, {
          path: normalizedUrl,
          method,
          dedupeKey,
        })

        throw error
      }
    })()

    inFlightRequests.set(dedupeKey, requestPromise as Promise<unknown>)

    try {
      return await requestPromise
    }
    finally {
      inFlightRequests.delete(dedupeKey)
    }
  }

  return {
    apiFetch,
  }
}
