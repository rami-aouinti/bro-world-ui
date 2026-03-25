import { normalizeErrorResponse } from '~/composables/api/responseNormalizer'
import { NormalizedApiClientError } from '~/composables/useApiClient'

type SensitiveFeedbackSeverity = 'info' | 'warning' | 'error'
type SensitiveFeedbackDisplayMode = 'toast' | 'alert'

type ResolveSensitiveErrorOptions = {
  authState?: string | null
  domain?: string
  fallbackKey?: string
  action?: 'load' | 'save' | 'delete' | 'update' | 'submit' | string
}

export type SensitivePageFeedback = {
  message: string
  status: number | null
  severity: SensitiveFeedbackSeverity
  displayMode: SensitiveFeedbackDisplayMode
  errorCode: string | null
  errorSource: string | null
  requestId: string | null
}

const isBackendDownError = (status: number | null, errorSource: string | null, errorCode: string | null) => {
  if (errorSource === 'network') {
    return true
  }

  if (status !== null && [502, 503, 504].includes(status)) {
    return true
  }

  if (!errorCode) {
    return false
  }

  return ['BACKEND_DOWN', 'BACKEND_UNAVAILABLE'].includes(errorCode)
}

const isAuthNotReadyError = (authState: string | null | undefined, errorSource: string | null, errorCode: string | null) => {
  if (authState === 'initializing') {
    return true
  }

  return errorSource === 'client_auth_guard' || errorCode === 'AUTH_NOT_READY'
}

export const useSensitivePageFeedback = () => {
  const { normalizeError } = useApiError()
  const route = useRoute()

  const isDebugMode = computed(() => {
    const debugQuery = String(route.query.debug ?? route.query.debugApi ?? '').toLowerCase()
    return ['1', 'true', 'yes', 'on'].includes(debugQuery)
  })

  const resolveSensitiveError = (error: unknown, options: ResolveSensitiveErrorOptions = {}): SensitivePageFeedback => {
    const normalized = normalizeError(error, options)
    const transport = error instanceof NormalizedApiClientError ? error.response : normalizeErrorResponse(error)
    const authState = options.authState ?? null

    if (isAuthNotReadyError(authState, transport.errorSource, transport.errorCode)) {
      return {
        message: 'Authentification en cours. Réessayez dans quelques secondes.',
        status: transport.status,
        severity: 'info',
        displayMode: 'toast',
        errorCode: transport.errorCode,
        errorSource: transport.errorSource,
        requestId: transport.requestId,
      }
    }

    if (transport.status === 401 && authState !== 'unauthenticated') {
      return {
        message: 'Votre session est refusée par le backend (401). Merci de recharger la page.',
        status: transport.status,
        severity: 'warning',
        displayMode: 'alert',
        errorCode: transport.errorCode,
        errorSource: transport.errorSource ?? 'backend_401',
        requestId: transport.requestId,
      }
    }

    if (isBackendDownError(transport.status, transport.errorSource, transport.errorCode)) {
      return {
        message: 'Le backend est indisponible pour le moment. Merci de réessayer plus tard.',
        status: transport.status,
        severity: 'error',
        displayMode: 'alert',
        errorCode: transport.errorCode,
        errorSource: transport.errorSource,
        requestId: transport.requestId,
      }
    }

    if (transport.status === 401 && authState === 'unauthenticated') {
      return {
        message: 'Vous n’êtes pas connecté.',
        status: transport.status,
        severity: 'warning',
        displayMode: 'toast',
        errorCode: transport.errorCode,
        errorSource: transport.errorSource,
        requestId: transport.requestId,
      }
    }

    return {
      message: normalized.message,
      status: normalized.status,
      severity: normalized.severity,
      displayMode: normalized.displayMode,
      errorCode: transport.errorCode,
      errorSource: transport.errorSource,
      requestId: transport.requestId,
    }
  }

  return {
    isDebugMode,
    resolveSensitiveError,
  }
}
