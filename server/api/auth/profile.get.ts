import type { SessionResponse } from '../../../app/types/api/user'
import { requireAuthCookie, setAuthCookie } from '../../../server/utils/authCookie'
import { fetchProfileWithAuthorization } from '../../../server/utils/authSessionBuilder'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const authCookie = await requireAuthCookie(event)
  const profile = await fetchProfileWithAuthorization(authCookie.token)

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
