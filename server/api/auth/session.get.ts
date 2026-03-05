import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
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

  const nextAuthCookie = await setAuthCookie(event, authCookie)

  return {
    authenticated: true,
    profile: nextAuthCookie.profile as UserProfile | null,
    roles: nextAuthCookie.roles,
    locale: nextAuthCookie.locale,
    expiresAt: nextAuthCookie.expiresAt,
  }
})
