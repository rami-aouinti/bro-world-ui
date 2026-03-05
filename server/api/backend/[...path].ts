import { applySessionCookie, refreshSession, requireSession } from '../../../server/utils/session'

const PUBLIC_BACKEND_PATHS = new Set([
  '/api/health',
  '/api/version',
  '/api/v1/localization/language',
  '/api/v1/localization/locale',
  '/api/v1/localization/timezone',
  '/api/v1/auth/get_token',
])

const buildForwardHeaders = (event: any): Record<string, string> => ({
  accept: getHeader(event, 'accept') || 'application/json',
  'content-type': getHeader(event, 'content-type') || 'application/json',
})

const handleBackendError = (error: any) => {
  const statusCode = error?.statusCode || error?.response?.status

  if (statusCode === 401 || statusCode === 403) {
    throw createError({
      statusCode,
      statusMessage: 'Backend authentication failed',
    })
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    throw createError({
      statusCode,
      statusMessage: 'Backend service unavailable',
    })
  }

  throw error
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const path = getRouterParam(event, 'path') || ''
  const targetPath = `/${path}`
  const isPublicRoute = PUBLIC_BACKEND_PATHS.has(targetPath)

  let sessionId: string | undefined
  let bearerToken: string | undefined

  if (!isPublicRoute) {
    const { sessionId: currentSessionId, session } = await requireSession(event)
    const nextSession = await refreshSession(currentSessionId, session)

    sessionId = currentSessionId
    bearerToken = nextSession.token
  }

  const method = getMethod(event)
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(event)

  try {
    const headers = buildForwardHeaders(event)

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    const response = await $fetch(targetPath, {
      method,
      baseURL: config.public.apiBase,
      query: getQuery(event),
      body,
      headers,
    })

    if (sessionId) {
      applySessionCookie(event, sessionId)
    }

    return response
  } catch (error) {
    handleBackendError(error)
  }
})
