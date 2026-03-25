import type { SessionResponse } from '../../../app/types/api/user'
import { readAuthCookie, setAuthCookie } from '../../../server/utils/authCookie'

const unauthenticatedResponse = (): SessionResponse => ({
  authenticated: false,
  profile: null,
  userSnapshot: null,
  roles: [],
  locale: null,
  sessionStatus: 'invalid',
})

const isFetchErrorWithStatus = (error: unknown): error is { response?: { status?: number } } => {
  return Boolean(error && typeof error === 'object' && 'response' in error)
}

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const authCookie = await readAuthCookie(event)

  if (!authCookie) {
    return unauthenticatedResponse()
  }

  try {
    const config = useRuntimeConfig()

    await $fetch('/api/v1/users/me', {
      method: 'GET',
      baseURL: config.public.apiBase,
      timeout: 4000,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${authCookie.token}`,
      },
    })
  }
  catch (error) {
    const statusCode = isFetchErrorWithStatus(error) ? error.response?.status : undefined

    // token persistence mode: no auto-clear on backend auth failure
    if (statusCode === 401 || statusCode === 403) {
      return {
        authenticated: true,
        profile: null,
        userSnapshot: authCookie.userSnapshot ?? null,
        roles: [],
        locale: null,
        sessionStatus: 'degraded',
      }
    }

    return {
      authenticated: true,
      profile: null,
      userSnapshot: authCookie.userSnapshot ?? null,
      roles: [],
      locale: null,
      sessionStatus: 'degraded',
    }
  }

  const nextAuthCookie = await setAuthCookie(event, {
    token: authCookie.token,
    sessionVersion: authCookie.sessionVersion,
    userSnapshot: authCookie.userSnapshot,
  })

  return {
    authenticated: true,
    profile: null,
    userSnapshot: nextAuthCookie.userSnapshot ?? null,
    roles: [],
    locale: null,
    sessionStatus: 'healthy',
    expiresAt: nextAuthCookie.expiresAt,
  }
})
