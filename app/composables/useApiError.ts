import { normalizeErrorResponse } from './api/responseNormalizer'
import { NormalizedApiClientError } from './useApiClient'

type ApiErrorSeverity = 'info' | 'warning' | 'error'
type ApiErrorDisplayMode = 'toast' | 'alert'

type UseApiErrorOptions = {
  domain?: string
  fallbackKey?: string
  action?: 'load' | 'save' | 'delete' | 'update' | 'submit' | string
}

export type NormalizedApiError = {
  status: number | null
  message: string
  i18nKey: string
  severity: ApiErrorSeverity
  displayMode: ApiErrorDisplayMode
}

type NuxtFetchErrorLike = {
  status?: number
  statusCode?: number
  response?: {
    status?: number
    _data?: unknown
  }
  data?: unknown
  message?: string
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const readErrorMessage = (error: NuxtFetchErrorLike) => {
  const candidatePayloads = [error.data, error.response?._data]

  for (const payload of candidatePayloads) {
    if (!isObject(payload)) {
      continue
    }

    const message = payload.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return typeof error.message === 'string' ? error.message : ''
}

const deriveStatus = (error: unknown): number | null => normalizeErrorResponse(error).status

export const useApiError = () => {
  const { t, te } = useI18n({ useScope: 'global' })

  const normalizeError = (error: unknown, options: UseApiErrorOptions = {}): NormalizedApiError => {
    const normalizedTransportError = error instanceof NormalizedApiClientError
      ? error.response
      : normalizeErrorResponse(error)
    const errorLike = (isObject(error) ? error : {}) as NuxtFetchErrorLike
    const status = deriveStatus(normalizedTransportError)

    const statusKey = status === 401
      ? 'errors.unauthorized'
      : status === 403
        ? 'errors.forbidden'
        : status === 404
          ? 'errors.notFound'
          : status !== null && status >= 500
            ? 'errors.server'
            : 'errors.network'

    const actionSuffix = options.action ? `.${options.action}` : ''
    const domainKey = options.domain ? `${options.domain}.errors${actionSuffix}` : ''
    const fallbackKey = options.fallbackKey ?? statusKey
    const i18nKey = domainKey && te(domainKey)
      ? domainKey
      : te(statusKey)
        ? statusKey
        : fallbackKey

    const message = t(i18nKey)
    const severity: ApiErrorSeverity = status !== null && status >= 500 ? 'error' : status === 401 || status === 403 ? 'warning' : 'info'
    const displayMode: ApiErrorDisplayMode = severity === 'error' ? 'alert' : 'toast'

    return {
      status,
      i18nKey,
      severity,
      displayMode,
      message: message || readErrorMessage(errorLike) || t('errors.unknown'),
    }
  }

  return {
    normalizeError,
  }
}
