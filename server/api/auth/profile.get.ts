import type { SessionResponse } from '../../../app/types/api/user'
import { requireAuthCookie, setAuthCookie } from '../../../server/utils/authCookie'
import { AUTH_ERROR_CODES, createAuthError, fetchProfileWithAuthorization } from '../../../server/utils/authSessionBuilder'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const authCookie = await requireAuthCookie(event)
  let profile

  try {
    profile = await fetchProfileWithAuthorization(authCookie.token)
  }
  catch (error: unknown) {
    const code = (error as { data?: { code?: string } })?.data?.code

    if (code === AUTH_ERROR_CODES.PROFILE_UNAUTHORIZED || code === AUTH_ERROR_CODES.TOKEN_INVALID) {
      throw createAuthError(401, 'Authentication token expired or invalid', AUTH_ERROR_CODES.TOKEN_INVALID)
    }

    throw createAuthError(502, 'Profile backend unavailable', AUTH_ERROR_CODES.PROFILE_FETCH_FAILED)
  }

  const nextAuthCookie = await setAuthCookie(event, {
    token: authCookie.token,
    sessionVersion: authCookie.sessionVersion,
  })

  return {
    authenticated: true,
    profile,
    roles: profile.roles ?? [],
    locale: profile.locale || profile.language || 'en',
    expiresAt: nextAuthCookie.expiresAt,
  }
})
