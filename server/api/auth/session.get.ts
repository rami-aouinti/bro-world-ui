import type { SessionResponse } from '../../../app/types/api/user'
import { readAuthCookie, setAuthCookie } from '../../../server/utils/authCookie'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const authCookie = await readAuthCookie(event)

  if (!authCookie) {
    return {
      authenticated: false,
      profile: null,
      roles: [],
      locale: null,
    }
  }

  const nextAuthCookie = await setAuthCookie(event, {
    token: authCookie.token,
    sessionVersion: authCookie.sessionVersion,
  })

  return {
    authenticated: true,
    profile: null,
    roles: [],
    locale: null,
    expiresAt: nextAuthCookie.expiresAt,
  }
})
