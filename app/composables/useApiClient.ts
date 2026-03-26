import {
  normalizeErrorResponse,
  normalizeSuccessResponse,
  normalizeUnknownErrorResponse,
  type ApiResponseEnvelope,
} from './api/responseNormalizer'
import { shouldLogTelemetry } from './telemetry'

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
const PUBLIC_QUIZ_ENDPOINT_PREFIX = 'api/v1/public/quiz/'
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
const MAX_RETRIES = 2
const NETWORK_RETRY_BASE_DELAY_MS = 120
const NETWORK_RETRY_JITTER_MS = 80
const BURST_WINDOW_MS = 1_000
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const inFlightRequests = new Map<string, Promise<unknown>>()
const endpoint401Counts = new Map<string, number>()
let burstWindowStartedAt = 0
let burstCount = 0
let sharedPrivateAuthInitPromise: Promise<void> | null = null

const normalizeApiPath = (url: string) => url.replace(/^\/+/, '')

const isCriticalApiCall = (normalizedUrl: string) => CRITICAL_API_PATTERNS.some(pattern => normalizedUrl.includes(pattern))
const isPrivateAuthRequiredEndpoint = (normalizedUrl: string) => {
  const lowerNormalizedUrl = normalizedUrl.toLowerCase()

  if (lowerNormalizedUrl.startsWith(PUBLIC_QUIZ_ENDPOINT_PREFIX)) {
    return false
  }

  return PRIVATE_AUTH_REQUIRED_PATTERNS.some(pattern => lowerNormalizedUrl.includes(pattern))
}
const isPrivateEndpoint = (url: string) => {
  const normalizedUrl = normalizeApiPath(url).toLowerCase()

  if (normalizedUrl.startsWith(PUBLIC_QUIZ_ENDPOINT_PREFIX)) {
    return false
  }

  if (PRIVATE_ENDPOINT_EXACT_MATCHES.has(normalizedUrl)) {
    return true
  }

  return PRIVATE_ENDPOINT_PREFIXES.some(pattern => normalizedUrl.startsWith(pattern))
}

const now = () => (import.meta.client ? performance.now() : Date.now())
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const getNetworkRetryDelay = (attempt: number) => {
  const cappedAttempt = Math.max(1, attempt)
  const exponentialBackoff = NETWORK_RETRY_BASE_DELAY_MS * 2 ** (cappedAttempt - 1)
  const jitter = Math.floor(Math.random() * NETWORK_RETRY_JITTER_MS)

  return exponentialBackoff + jitter
}

export class NormalizedApiClientError extends Error {
  response: ApiResponseEnvelope<null>

  constructor(response: ApiResponseEnvelope<null>, message = 'API request failed') {
    super(message)
    this.name = 'NormalizedApiClientError'
    this.response = response
  }
}

type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  retryUnsafeMutations?: boolean
  idempotencyKey?: string
  skipAuthHeader?: boolean
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

const serializeRequestBodyForDedupe = (body: unknown): string | null => {
  if (body === null || body === undefined) {
    return ''
  }

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    const entries = Array.from(body.entries())
      .sort(([firstKey, firstValue], [secondKey, secondValue]) => `${firstKey}:${firstValue}`.localeCompare(`${secondKey}:${secondValue}`))

    return `urlsearchparams:${stableSerialize(entries)}`
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const entries = Array.from(body.entries())
      .map(([key, value]) => {
        if (typeof File !== 'undefined' && value instanceof File) {
          return [key, `file:${value.name}:${value.size}:${value.type}:${value.lastModified}`] as const
        }

        if (typeof Blob !== 'undefined' && value instanceof Blob) {
          return [key, `blob:${value.size}:${value.type}`] as const
        }

        return [key, `text:${String(value)}`] as const
      })
      .sort(([firstKey, firstValue], [secondKey, secondValue]) => `${firstKey}:${firstValue}`.localeCompare(`${secondKey}:${secondValue}`))

    return `formdata:${stableSerialize(entries)}`
  }

  if (typeof File !== 'undefined' && body instanceof File) {
    return `file:${body.name}:${body.size}:${body.type}:${body.lastModified}`
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return `blob:${body.size}:${body.type}`
  }

  if (typeof body === 'object') {
    const objectTag = Object.prototype.toString.call(body)
    const isPlainObject = objectTag === '[object Object]'
    const isArray = Array.isArray(body)
    const isDate = body instanceof Date

    if (!isPlainObject && !isArray && !isDate) {
      return null
    }
  }

  return stableSerialize(body)
}

const buildRequestDedupeKey = (method: string, normalizedUrl: string, options: ApiFetchOptions<unknown>) => {
  const isMutation = MUTATION_METHODS.has(method)
  const hasExplicitIdempotencyKey = Boolean(options.idempotencyKey)

  if (isMutation && !hasExplicitIdempotencyKey) {
    return null
  }

  const query = stableSerialize(options.query)
  const serializedBody = serializeRequestBodyForDedupe(options.body)

  if (serializedBody === null) {
    return null
  }

  const bodyHash = hashValue(serializedBody)
  const idempotencyPart = hasExplicitIdempotencyKey ? `|${options.idempotencyKey}` : ''

  return `${method}|${normalizedUrl}|${query}|${bodyHash}${idempotencyPart}`
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

const logConsoleTelemetry = (
  level: 'info' | 'warn',
  label: string,
  payload: Record<string, unknown>,
  options: { critical?: boolean } = {},
) => {
  if (!shouldLogTelemetry() && !(level === 'warn' && options.critical)) {
    return
  }

  const logger = level === 'warn' ? console.warn : console.info
  logger(label, payload)
}

const logApiEvent = (
  payload: {
    event: string
    [key: string]: unknown
  },
  options: { critical?: boolean } = {},
) => {
  logConsoleTelemetry('info', '[auth-correlation]', payload, options)
}

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
  options: { critical?: boolean } = {},
) => {
  logConsoleTelemetry(level, '[api-telemetry]', payload, options)
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

  logConsoleTelemetry('warn', '[api-telemetry][401-top-endpoints]', {
    total401,
    topEndpoints,
    sessionCorrelationId,
  }, { critical: true })
}

const ensurePrivateAuthReady = async (auth: ReturnType<typeof useAuth>) => {
  const isSessionReady = auth.initialized.value && auth.authState.value !== 'initializing'

  if (!isSessionReady) {
    if (!sharedPrivateAuthInitPromise) {
      sharedPrivateAuthInitPromise = (async () => {
        try {
          await auth.initSession()
        }
        finally {
          sharedPrivateAuthInitPromise = null
        }
      })()
    }

    await sharedPrivateAuthInitPromise
  }

  if (auth.authState.value === 'initializing') {
    await auth.awaitAuthReady()
  }
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
      await ensurePrivateAuthReady(auth)
    }

    const token = authSession.token
    const hasBearerToken = Boolean(token && token !== SERVER_SESSION_PLACEHOLDER)
    const startedAt = now()
    const method = resolveMethod(options.method)
    const requestCorrelationId = `${method.toLowerCase()}-${Date.now()}-${hashValue(`${normalizedUrl}:${Math.random()}`)}`
    const dedupeKey = buildRequestDedupeKey(method, normalizedUrl, options as ApiFetchOptions<unknown>)
    const existingRequest = dedupeKey
      ? (inFlightRequests.get(dedupeKey) as Promise<T> | undefined)
      : undefined
    const isAuthRequiredEndpoint = isPrivateAuthRequiredEndpoint(normalizedUrl)
    const isPublicQuizEndpoint = normalizedUrl.toLowerCase().startsWith(PUBLIC_QUIZ_ENDPOINT_PREFIX)
    const canUsePrivateSession = auth.authState.value === 'authenticated' || auth.authState.value === 'degraded'
    const hasAuthenticatedSession = canUsePrivateSession || Boolean(requestAuthorization)

    if (existingRequest) {
      tracker.track('api.request.deduplicated', {
        path: normalizedUrl,
        method,
      })

      return existingRequest
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
      }, { critical: true })
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

      throw new NormalizedApiClientError(normalizeErrorResponse(unauthorizedError, 403))
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
      }, { critical: true })
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

      throw new NormalizedApiClientError(normalizeErrorResponse(unauthorizedError, 401))
    }
    const isMutation = MUTATION_METHODS.has(method)
    const canRetryMutation = Boolean(options.idempotencyKey || options.retryUnsafeMutations)
    const canRetry = !isMutation || canRetryMutation
    const maxRetries = canRetry ? MAX_RETRIES : 0

    const nextHeaders: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (!options.skipAuthHeader && !nextHeaders.Authorization && hasBearerToken) {
      nextHeaders.Authorization = `Bearer ${token}`
    }

    if (!options.skipAuthHeader && !nextHeaders.Authorization && requestAuthorization) {
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
        delete fetchOptions.skipAuthHeader

        let lastError: unknown = null

        for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
          try {
            const response = await $fetch.raw<T>(`/api/backend/${normalizedUrl}`, {
              ...fetchOptions,
              credentials: 'include',
              headers: nextHeaders,
            })
            const normalizedResponse = normalizeSuccessResponse<T>(
              response.status,
              response._data as T,
              response.headers,
            )

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
              logApiEvent({
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

            return normalizedResponse.data as T
          }
          catch (error) {
            lastError = error

            const normalizedError = normalizeErrorResponse(error)
            const status = normalizedError.status
            const is401 = status === 401
            const isRetryableStatus = typeof status === 'number' && status >= 500 && status < 600
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
              errorSource: normalizedError.errorSource ?? errorSource,
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

              if (isPublicQuizEndpoint) {
                break
              }

              auth.lastAuthFailureAt.value = now()
              break
            }

            if (!(isRetryableError && hasRemainingAttempts && canRetry)) {
              break
            }

            if (isNetworkError) {
              await sleep(getNetworkRetryDelay(attempt))
            }
          }
        }

        throw new NormalizedApiClientError(
          lastError ? normalizeErrorResponse(lastError) : normalizeUnknownErrorResponse(),
        )
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

    if (dedupeKey) {
      inFlightRequests.set(dedupeKey, requestPromise as Promise<unknown>)
    }

    try {
      return await requestPromise
    }
    finally {
      if (dedupeKey) {
        inFlightRequests.delete(dedupeKey)
      }
    }
  }

  return {
    apiFetch,
  }
}
