const SERVER_SESSION_PLACEHOLDER = '__server_session__'
const CRITICAL_API_PATTERNS = [
  'api/v1/auth',
  'api/v1/applications',
  'api/v1/crm',
]
const PRIVATE_AUTH_REQUIRED_PATTERNS = [
  'api/v1/blog',
  'api/v1/quiz',
]
const PRIVATE_ENDPOINT_PREFIXES = [
  'api/v1/private/',
  'api/v1/users/me',
  'api/v1/chat/private/',
]
const PRIVATE_ENDPOINT_EXACT_MATCHES = new Set([
  'api/v1/notifications',
])
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
const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504])
const RETRY_DELAYS_IN_MS = [150, 300]
const MAX_RETRIES = 2
const AUTH_REVALIDATION_COOLDOWN_MS = 20_000
const BURST_WINDOW_MS = 1_000
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const AUTH_AUTO_RETRY_EXCLUSIONS = ['api/auth/login', 'api/auth/register']
const inFlightRequests = new Map<string, Promise<unknown>>()
const endpoint401Counts = new Map<string, number>()
let burstWindowStartedAt = 0
let burstCount = 0
let sharedAuthRevalidationPromise: Promise<boolean> | null = null
let lastGlobalAuthRevalidationAt = 0

const normalizeApiPath = (url: string) => url.replace(/^\/+/, '')

const isCriticalApiCall = (normalizedUrl: string) => CRITICAL_API_PATTERNS.some(pattern => normalizedUrl.includes(pattern))
const isPrivateAuthRequiredEndpoint = (normalizedUrl: string) => {
  const lowerNormalizedUrl = normalizedUrl.toLowerCase()
  return PRIVATE_AUTH_REQUIRED_PATTERNS.some(pattern => lowerNormalizedUrl.includes(pattern))
}
const isPrivateEndpoint = (url: string) => {
  const normalizedUrl = normalizeApiPath(url).toLowerCase()

  if (PRIVATE_ENDPOINT_EXACT_MATCHES.has(normalizedUrl)) {
    return true
  }

  return PRIVATE_ENDPOINT_PREFIXES.some(pattern => normalizedUrl.startsWith(pattern))
}

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

const getErrorStatus = (error: unknown) => (error as { status?: number, response?: { status?: number } })?.status
  ?? (error as { response?: { status?: number } })?.response?.status

const logApiTelemetry = (
  level: 'info' | 'warn',
  payload: {
    path: string
    isPrivate: boolean
    authState: string
    attempt: number
    responseStatus: number | string
    errorSource: string | null
    sessionCorrelationId: string | null
    method: string
    event?: string
    [key: string]: unknown
  },
) => {
  const logger = level === 'warn' ? console.warn : console.info
  logger('[api-telemetry]', payload)
}

const recordTop401Endpoint = (
  normalizedUrl: string,
  method: string,
  source: 'backend_401' | 'local_401_missing_cookie',
  sessionCorrelationId: string | null,
) => {
  const key = `${method} ${normalizedUrl} [${source}]`
  endpoint401Counts.set(key, (endpoint401Counts.get(key) || 0) + 1)
  const total401 = Array.from(endpoint401Counts.values()).reduce((sum, count) => sum + count, 0)

  if (total401 % 10 !== 0) {
    return
  }

  const topEndpoints = Array
    .from(endpoint401Counts.entries())
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .map(([endpointKey, count]) => ({ endpointKey, count }))

  console.warn('[api-telemetry][401-top-endpoints]', {
    total401,
    topEndpoints,
    sessionCorrelationId,
  })
}

const revalidateSessionWithGlobalThrottle = async (auth: ReturnType<typeof useAuth>) => {
  if (sharedAuthRevalidationPromise) {
    return sharedAuthRevalidationPromise
  }

  const currentTime = now()
  const isWithinGlobalThrottleWindow = lastGlobalAuthRevalidationAt > 0
    && (currentTime - lastGlobalAuthRevalidationAt) < AUTH_REVALIDATION_COOLDOWN_MS

  if (isWithinGlobalThrottleWindow) {
    return false
  }

  const lastFailureAt = auth.lastAuthFailureAt.value
  const isInCooldownWindow = lastFailureAt > 0 && (currentTime - lastFailureAt) < AUTH_REVALIDATION_COOLDOWN_MS

  if (isInCooldownWindow) {
    return false
  }

  sharedAuthRevalidationPromise = (async () => {
    try {
      lastGlobalAuthRevalidationAt = now()
      await auth.initSession(true)
      return true
    }
    catch (error) {
      auth.lastAuthFailureAt.value = now()
      throw error
    }
    finally {
      sharedAuthRevalidationPromise = null
    }
  })()

  return sharedAuthRevalidationPromise
}

const track401Burst = (tracker: ReturnType<typeof useTracker>, path: string, method: string) => {
  const currentTime = now()

  if (!burstWindowStartedAt || currentTime - burstWindowStartedAt > BURST_WINDOW_MS) {
    burstWindowStartedAt = currentTime
    burstCount = 0
  }

  burstCount += 1

  tracker.track('401_burst', {
    count: burstCount,
    path,
    method,
    windowMs: BURST_WINDOW_MS,
  })
}

export const useApiClient = () => {
  const authSession = useAuthSessionStore()
  const tracker = useTracker()
  const auth = useAuth()
  const requestHeaders = import.meta.server ? useRequestHeaders(['authorization']) : {}

  const apiFetch = async <T>(url: string, options: ApiFetchOptions<T> = {}) => {
    const normalizedUrl = normalizeApiPath(url)
    const requestAuthorization = requestHeaders.authorization
    const isPrivateRoute = isPrivateEndpoint(normalizedUrl)
    const sessionCorrelationId = auth.sessionCorrelationId.value

    if (isPrivateRoute) {
      await auth.awaitAuthReady()
    }

    const token = authSession.token
    const hasBearerToken = Boolean(token && token !== SERVER_SESSION_PLACEHOLDER)
    const startedAt = now()
    const method = resolveMethod(options.method)
    const requestCorrelationId = `${method.toLowerCase()}-${Date.now()}-${hashValue(`${normalizedUrl}:${Math.random()}`)}`
    const dedupeKey = buildRequestDedupeKey(method, normalizedUrl, options as ApiFetchOptions<unknown>)
    const existingRequest = inFlightRequests.get(dedupeKey) as Promise<T> | undefined
    const isAuthRequiredEndpoint = isPrivateAuthRequiredEndpoint(normalizedUrl)
    const canUsePrivateSession = auth.authState.value === 'authenticated' || auth.authState.value === 'degraded'
    const hasAuthenticatedSession = canUsePrivateSession || Boolean(requestAuthorization)

    if (existingRequest) {
      tracker.track('api.request.deduplicated', {
        path: normalizedUrl,
        method,
      })

      return existingRequest
    }

    if (isPrivateRoute && auth.authState.value === 'initializing') {
      logApiTelemetry('warn', {
        event: 'api.blocked.auth_not_ready',
        path: normalizedUrl,
        isPrivate: isPrivateRoute,
        authState: auth.authState.value,
        attempt: 1,
        responseStatus: 503,
        errorSource: 'client_auth_guard',
        method,
        sessionCorrelationId,
      })
      const initializingError = createError({
        statusCode: 503,
        statusMessage: 'Authentication is initializing',
        data: { telemetryCategory: 'private_endpoint_blocked_initializing' },
      })

      tracker.trackError('api.request.failed', initializingError, {
        path: normalizedUrl,
        method,
        dedupeKey,
      })

      throw initializingError
    }

    if (isPrivateRoute && !hasAuthenticatedSession) {
      logApiTelemetry('warn', {
        event: 'api.blocked.auth_not_ready',
        path: normalizedUrl,
        isPrivate: isPrivateRoute,
        authState: auth.authState.value,
        attempt: 1,
        responseStatus: 403,
        errorSource: 'client_auth_guard',
        method,
        sessionCorrelationId,
      })
      auth.lastAuthFailureAt.value = now()
      const unauthorizedError = createError({
        statusCode: 403,
        statusMessage: 'Authentication required',
        data: { telemetryCategory: 'private_endpoint_blocked_client_side' },
      })

      tracker.trackError('api.request.failed', unauthorizedError, {
        path: normalizedUrl,
        method,
        dedupeKey,
      })

      throw unauthorizedError
    }
    if (isAuthRequiredEndpoint && !hasAuthenticatedSession) {
      tracker.track('api.error.auth_missing_local', {
        path: normalizedUrl,
        method,
        sessionCorrelationId,
      })
      logApiTelemetry('warn', {
        event: 'api.error.auth_missing_local',
        path: normalizedUrl,
        isPrivate: isPrivateRoute,
        authState: auth.authState.value,
        attempt: 1,
        responseStatus: 401,
        errorSource: 'local_auth_missing',
        method,
        sessionCorrelationId,
      })
      track401Burst(tracker, normalizedUrl, method)
      recordTop401Endpoint(normalizedUrl, method, 'local_401_missing_cookie', auth.sessionCorrelationId.value)
      auth.lastAuthFailureAt.value = now()
      const unauthorizedError = createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        data: { telemetryCategory: 'local_401_missing_cookie' },
      })

      tracker.trackError('api.request.failed', unauthorizedError, {
        path: normalizedUrl,
        method,
        dedupeKey,
      })

      throw unauthorizedError
    }
    const isMutation = MUTATION_METHODS.has(method)
    const canRetryMutation = Boolean(options.idempotencyKey || options.retryUnsafeMutations)
    const canRetry = !isMutation || canRetryMutation
    const isAutoRetryExcludedPath = AUTH_AUTO_RETRY_EXCLUSIONS.some(path => normalizedUrl.startsWith(path))
    const maxRetries = canRetry && !isAutoRetryExcludedPath ? MAX_RETRIES : 0

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

    if (!nextHeaders['x-session-correlation-id'] && auth.sessionCorrelationId.value) {
      nextHeaders['x-session-correlation-id'] = auth.sessionCorrelationId.value
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

        let hasRetriedAfter401 = false
        let hasConsumedAuthReplay = false

        for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
          try {
            const response = await $fetch<T>(`/api/backend/${normalizedUrl}`, {
              ...fetchOptions,
              credentials: 'include',
              headers: nextHeaders,
            })

            logApiTelemetry('info', {
              path: normalizedUrl,
              isPrivate: isPrivateRoute,
              authState: auth.authState.value,
              method,
              attempt,
              responseStatus: '2xx',
              errorSource: null,
              hasBearerToken,
              hasAuthorizationHeader: Boolean(nextHeaders.Authorization),
              sessionCorrelationId,
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

            auth.lastAuthFailureAt.value = 0

            return response
          }
          catch (error) {
            lastError = error

            const status = getErrorStatus(error)
            const is401 = status === 401
            const isRetryableStatus = status !== undefined && RETRYABLE_HTTP_STATUSES.has(status)
            const isNetworkError = isRetryableNetworkError(error)
            const isRetryableError = !is401 && (isRetryableStatus || isNetworkError)
            const hasRemainingAttempts = attempt <= maxRetries
            const telemetrySource = (error as { data?: { telemetryCategory?: string } })?.data?.telemetryCategory
            const authFailureType = telemetrySource === 'local_401_missing_cookie'
              ? 'local_401_missing_cookie'
              : 'backend_401'

            const errorSource = isNetworkError
              ? 'network'
              : (is401 ? authFailureType : 'http')

            logApiTelemetry('warn', {
              path: normalizedUrl,
              isPrivate: isPrivateRoute,
              authState: auth.authState.value,
              method,
              attempt,
              responseStatus: status || 'network_error',
              errorSource,
              hasBearerToken,
              hasAuthorizationHeader: Boolean(nextHeaders.Authorization),
              errorType: isNetworkError ? 'network_error' : (is401 ? authFailureType : 'http_error'),
              sessionCorrelationId,
            })

            if (is401) {
              if (authFailureType === 'backend_401') {
                tracker.track('api.error.401.backend', {
                  path: normalizedUrl,
                  method,
                  attempt,
                  sessionCorrelationId,
                })
              }
              track401Burst(tracker, normalizedUrl, method)
              recordTop401Endpoint(normalizedUrl, method, authFailureType, auth.sessionCorrelationId.value)

              if (hasRetriedAfter401 || isAutoRetryExcludedPath) {
                auth.lastAuthFailureAt.value = now()
                break
              }

              hasRetriedAfter401 = true
              hasConsumedAuthReplay = true

              const didRevalidateSession = await revalidateSessionWithGlobalThrottle(auth)

              if (!didRevalidateSession) {
                auth.lastAuthFailureAt.value = now()
                break
              }

              if (didRevalidateSession) {
                console.info('[auth-correlation]', {
                  event: 'session.revalidation.confirmed_401',
                  requestCorrelationId,
                  sessionCorrelationId: auth.sessionCorrelationId.value,
                  path: normalizedUrl,
                  method,
                })
              }

              continue
            }

            if (hasConsumedAuthReplay) {
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
