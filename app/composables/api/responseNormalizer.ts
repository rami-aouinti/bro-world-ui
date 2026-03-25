export type ApiResponseEnvelope<T> = {
  ok: boolean
  status: number | null
  data: T | null
  errorCode: string | null
  errorSource: string | null
  requestId: string | null
}

type HeadersLike = {
  get?: (name: string) => string | null
}

type ApiErrorLike = {
  status?: unknown
  statusCode?: unknown
  response?: {
    status?: unknown
    _data?: unknown
    headers?: HeadersLike
  }
  data?: unknown
  message?: unknown
  code?: unknown
}

const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR'

const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null)

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

const readRequestId = (headers?: HeadersLike): string | null => {
  if (!headers?.get) {
    return null
  }

  return headers.get('x-request-id')
    ?? headers.get('x-correlation-id')
    ?? headers.get('x-amzn-requestid')
    ?? null
}

const readErrorPayload = (error: ApiErrorLike): Record<string, unknown> | null => {
  const candidates = [error.data, error.response?._data]

  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (record) {
      return record
    }
  }

  return null
}

export const normalizeSuccessResponse = <T>(status: number, data: T, headers?: HeadersLike): ApiResponseEnvelope<T> => ({
  ok: true,
  status,
  data,
  errorCode: null,
  errorSource: null,
  requestId: readRequestId(headers),
})

export const normalizeErrorResponse = (error: unknown, fallbackStatus = 500): ApiResponseEnvelope<null> => {
  const errorLike = (error as ApiErrorLike | undefined) ?? {}
  const payload = readErrorPayload(errorLike)

  const status = asNumber(errorLike.statusCode)
    ?? asNumber(errorLike.status)
    ?? asNumber(errorLike.response?.status)
    ?? fallbackStatus

  const errorCode = asString(payload?.errorCode)
    ?? asString(payload?.code)
    ?? asString(errorLike.code)
    ?? UNKNOWN_ERROR_CODE

  const errorSource = asString(payload?.errorSource)
    ?? (status >= 500 ? 'server' : status >= 400 ? 'client' : 'network')

  return {
    ok: false,
    status,
    data: null,
    errorCode,
    errorSource,
    requestId: readRequestId(errorLike.response?.headers),
  }
}

export const normalizeUnknownErrorResponse = (): ApiResponseEnvelope<null> => ({
  ok: false,
  status: 500,
  data: null,
  errorCode: UNKNOWN_ERROR_CODE,
  errorSource: 'client',
  requestId: null,
})
